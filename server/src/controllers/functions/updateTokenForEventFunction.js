import {
  PrivateKey,
  TokenUpdateTransaction,
  TokenId,
  Status,
} from "@hashgraph/sdk";
import supabase from "../../db/db.js";
import { getHederaClient } from "../../hedera/hederaClient.js";
import { decryptKey } from "../../utils/crypto.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

export const updateTokenForEventFunction = async (req, res, next) => {
  try {
    const { event_id, newName, newDescription, newImage } = req.body;

    if (!event_id || !newName || !newDescription || !newImage) {
      throw new Error("Faltan parámetros requeridos");
    }

    const { data: event, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();

    if (error || !event) throw new Error("Evento no encontrado");
    if (!event.token_id) throw new Error("Token no creado para este evento");

    // 1. Subir imagen a IPFS
    const imageResponse = await axios.get(newImage, {
      responseType: "arraybuffer",
    });
    const __dirname = path.resolve();

    const tempFilePath = path.join(__dirname, "temp-image");
    fs.writeFileSync(tempFilePath, imageResponse.data);

    const imageType = imageResponse.headers["content-type"] || "image/png";
    const imageExt = imageType.split("/")[1] || "png";

    const imageFormData = new FormData();
    imageFormData.append("file", fs.createReadStream(tempFilePath), {
      filename: `event-${event_id}-image.${imageExt}`,
      contentType: imageType,
    });

    const imageUpload = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      imageFormData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...imageFormData.getHeaders(),
        },
      }
    );

    const imageCID = imageUpload.data.IpfsHash;
    const imageURI = `ipfs://${imageCID}`;

    // 2. Construir metadata HIP412
    const metadata = {
      format: "HIP412@2.0.0",
      name: newName,
      creator: "Sonnar by Polaris",
      description: newDescription,
      image: imageURI,
      attributes: [
        {
          trait_type: "Event Type",
          value: event.is_online ? "Online" : "Presencial",
        },
        {
          trait_type: "Event Goal",
          value: event.goal_amount,
        },
        {
          trait_type: "Event Date",
          value: event.date,
        },
        {
          trait_type: "Event Location",
          value: event.is_online ? event.address : event.city,
        },
        {
          trait_type: "Event Price",
          value: event.entry_price,
        },
        {
          trait_type: "Event Capacity",
          value: event.capacity,
        },
      ],
      files: [
        {
          uri: imageURI,
          type: imageType,
          is_default_file: true,
        },
      ],
    };

    // 3. Subir metadata a IPFS
    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        pinataMetadata: { name: `${event_id}_metadata` },
        pinataContent: metadata,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    const metadataCID = metadataResponse.data.IpfsHash;

    // Eliminar archivo temporal
    fs.unlinkSync(tempFilePath);

    // 4. Actualizar token en Hedera
    const operatorKey = PrivateKey.fromString(
      decryptKey(event.parti_wallet_private_key)
    );
    const client = getHederaClient().setOperator(
      event.parti_wallet,
      operatorKey
    );

    const ipfsBytes = new TextEncoder().encode(metadataCID);
    if (ipfsBytes.length > 100)
      throw new Error("El hash IPFS excede el límite de 100 bytes");

    const transaction = await new TokenUpdateTransaction()
      .setTokenId(TokenId.fromString(event.token_id))
      .setMetadata(ipfsBytes)
      .freezeWith(client);

    transaction.sign(operatorKey);
    transaction.sign(
      PrivateKey.fromString(decryptKey(event.token_admin_private_key))
    );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Transacción fallida: ${receipt.status}`);
    }

    // 5. Actualizar base de datos
    const { error: updateError } = await supabase
      .from("parties")
      .update({
        token_metadata: metadataCID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", event_id);

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: "Token actualizado correctamente",
      ipfsHash: metadataCID,
      tokenId: event.token_id,
      imageCID,
    });
  } catch (e) {
    console.error("Error en updateTokenForEvent:", e);
    next(new Error(`Error al actualizar el token: ${e.message}`));
  }
};
