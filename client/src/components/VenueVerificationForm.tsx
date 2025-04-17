import { useState } from "react";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Venue } from "@/types/supabase";

type VenueVerificationFormProps = {
  onComplete: () => void;
  onCancel: () => void;
};

const VenueVerificationForm = ({ onComplete, onCancel }: VenueVerificationFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    dni: "",
  });
  
  const [photos, setPhotos] = useState({
    venue: null as File | null,
    owner: null as File | null,
    proof: null as File | null,
  });
  
  const [previews, setPreviews] = useState({
    venue: null as string | null,
    owner: null as string | null,
    proof: null as string | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'venue' | 'owner' | 'proof') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos(prev => ({ ...prev, [type]: file }));
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, type: 'venue' | 'owner' | 'proof') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}_${type}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('venues')
      .upload(fileName, file, { upsert: true });
      
    if (error) throw error;
    
    const { data: url } = supabase.storage.from('venues').getPublicUrl(fileName);
    return url.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.address || !formData.description || !formData.dni) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (!photos.venue || !photos.owner || !photos.proof) {
      toast.error("Todas las fotos son obligatorias");
      return;
    }

    try {
      setLoading(true);
      
      // Upload venue photo
      const venuePhotoFile = photos.venue;
      const venuePhotoUrl = await uploadFile(venuePhotoFile, 'venue');
      
      // Upload owner photo
      const ownerPhotoFile = photos.owner;
      const ownerPhotoUrl = await uploadFile(ownerPhotoFile, 'owner');
      
      // Upload proof photo
      const proofPhotoFile = photos.proof;
      const proofPhotoUrl = await uploadFile(proofPhotoFile, 'proof');
      
      // Insert venue record
      const { error } = await supabase
        .from('venues')
        .insert({
          user_id: user?.id,
          name: formData.name,
          address: formData.address,
          description: formData.description,
          dni: formData.dni,
          venue_photo_url: venuePhotoUrl,
          owner_photo_url: ownerPhotoUrl,
          proof_photo_url: proofPhotoUrl,
          status: 'pending'
        });
        
      if (error) throw error;
      
      toast.success("Solicitud enviada para verificación");
      onComplete();
    } catch (error: any) {
      console.error('Error submitting venue:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={onCancel}
          className="mr-4 text-fiesta-muted hover:text-fiesta-dark"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Verificación de Local</h1>
      </div>
      
      <p className="text-fiesta-muted mb-6">
        Para verificar tu local, necesitamos algunos datos y fotos que serán revisados por nuestro equipo.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre del local
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Ej. Club Tropical"
            required
          />
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            Dirección completa
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Dirección del local"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="input-primary min-h-[100px]"
            placeholder="Cuéntanos sobre tu local"
            required
          />
        </div>
        
        <div>
          <label htmlFor="dni" className="block text-sm font-medium mb-1">
            DNI/Documento de identidad
          </label>
          <input
            id="dni"
            name="dni"
            type="text"
            value={formData.dni}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Tu número de documento"
            required
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Fotografías requeridas:</h3>
          
          <div>
            <label className="block text-sm mb-2">
              1. Foto del local (exterior o interior)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {previews.venue ? (
                <div className="relative">
                  <img 
                    src={previews.venue} 
                    alt="Vista previa del local" 
                    className="mx-auto h-40 object-cover rounded-lg"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setPhotos(prev => ({ ...prev, venue: null }));
                      setPreviews(prev => ({ ...prev, venue: null }));
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="venue-photo" className="cursor-pointer block py-4">
                  <Store size={32} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-fiesta-muted">Haz clic para subir una foto</span>
                  <input
                    id="venue-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'venue')}
                    required
                  />
                </label>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-2">
              2. Foto tuya en el local
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {previews.owner ? (
                <div className="relative">
                  <img 
                    src={previews.owner} 
                    alt="Vista previa del propietario" 
                    className="mx-auto h-40 object-cover rounded-lg"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setPhotos(prev => ({ ...prev, owner: null }));
                      setPreviews(prev => ({ ...prev, owner: null }));
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="owner-photo" className="cursor-pointer block py-4">
                  <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-fiesta-muted">Haz clic para subir una foto</span>
                  <input
                    id="owner-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'owner')}
                    required
                  />
                </label>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-2">
              3. Foto tuya con un cartel que diga "Soy el propietario del local"
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {previews.proof ? (
                <div className="relative">
                  <img 
                    src={previews.proof} 
                    alt="Vista previa de la prueba" 
                    className="mx-auto h-40 object-cover rounded-lg"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setPhotos(prev => ({ ...prev, proof: null }));
                      setPreviews(prev => ({ ...prev, proof: null }));
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <label htmlFor="proof-photo" className="cursor-pointer block py-4">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-fiesta-muted">Haz clic para subir una foto</span>
                  <input
                    id="proof-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'proof')}
                    required
                  />
                </label>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-4 flex space-x-4">
          <ButtonAnimated
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </ButtonAnimated>
          
          <ButtonAnimated
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            isLoading={loading}
          >
            Enviar solicitud
          </ButtonAnimated>
        </div>
      </form>
    </div>
  );
};

export default VenueVerificationForm;
