import supabase from "../../db/db.js";

export const getTokenMetadataFunction = async (req, res, next) => {
  try {
    const { event_id } = req.query;

    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!data || error) throw new Error("Evento no encontrado");

    fetch(
      `https://white-kind-toad-673.mypinata.cloud/ipfs/${data.token_metadata}`
    )
      .then((response) => response.json())
      .then((data) => {
        res.json({ success: true, metadata: data });
      });
  } catch (e) {
    console.error("Error en getTokenMetadata:", e);
    next(new Error(`Error al obtener metadatos del token: ${e.message}`));
  }
};
