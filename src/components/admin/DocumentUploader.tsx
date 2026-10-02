'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, File, FileText, Image as ImageIcon, Trash2, Download, Eye, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DocumentJustificatif } from '@/types/database.types';

interface DocumentUploaderProps {
  contratBailId?: string;
  transactionVenteId?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ contratBailId, transactionVenteId }) => {
  const [documents, setDocuments] = useState<DocumentJustificatif[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [docType, setDocType] = useState('autre');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const fetchDocuments = async () => {
    setIsLoading(true);
    let query = supabase.from('documents_justificatifs').select('*').order('created_at', { ascending: false });
    
    if (contratBailId) query = query.eq('contrat_bail_id', contratBailId);
    else if (transactionVenteId) query = query.eq('transaction_vente_id', transactionVenteId);
    else {
      setIsLoading(false);
      return;
    }

    const { data, error } = await query;
    if (!error && data) setDocuments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (contratBailId || transactionVenteId) {
      fetchDocuments();
    }
  }, [contratBailId, transactionVenteId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!contratBailId && !transactionVenteId) {
      alert("Erreur: ID de contrat introuvable.");
      return;
    }

    setIsUploading(true);
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${contratBailId || transactionVenteId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('documents_contrats')
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Erreur lors de l'upload du fichier: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents_contrats')
      .getPublicUrl(filePath);

    // Save metadata to database
    const payload = {
      nom_fichier: file.name,
      type_document: docType,
      fichier_url: publicUrl,
      taille_bytes: file.size,
      contrat_bail_id: contratBailId || null,
      transaction_vente_id: transactionVenteId || null,
    };

    const { error: dbError } = await supabase.from('documents_justificatifs').insert([payload]);
    
    if (dbError) {
      console.error(dbError);
      alert("Erreur lors de l'enregistrement du document en base.");
    } else {
      await fetchDocuments();
    }

    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    setIsUploading(false);
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    // Delete from DB
    await supabase.from('documents_justificatifs').delete().eq('id', id);
    
    // Extract file path from URL to delete from storage
    // URL looks like: https://[project].supabase.co/storage/v1/object/public/documents_contrats/[path]
    const pathParts = url.split('/documents_contrats/');
    if (pathParts.length === 2) {
      await supabase.storage.from('documents_contrats').remove([pathParts[1]]);
    }

    fetchDocuments();
  };

  const getIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon className="w-8 h-8 text-sky-500" />;
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!contratBailId && !transactionVenteId) {
    return <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">Veuillez d'abord enregistrer le contrat avant d'ajouter des documents.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Documents & Justificatifs</h4>
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold">{documents.length} fichier(s)</span>
      </div>

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 text-center">
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-600">Envoi du document en cours...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center mb-2">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 font-medium">Ajoutez un document à ce dossier</p>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <select 
                value={docType} 
                onChange={e => setDocType(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="piece_identite">Pièce d'identité</option>
                <option value="titre_foncier">Titre Foncier / ACD</option>
                <option value="contrat_signe">Contrat signé</option>
                <option value="quittance">Quittance / Reçu</option>
                <option value="autre">Autre document</option>
              </select>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm"
              >
                📁 Parcourir
              </button>

              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Prendre une photo
              </button>

              {/* Hidden inputs */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,image/*" 
                onChange={handleFileUpload} 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-xs text-slate-500">Chargement des documents...</div>
      ) : documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition group">
              <div className="mr-3">
                {getIcon(doc.nom_fichier)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate" title={doc.nom_fichier}>{doc.nom_fichier}</p>
                <div className="flex items-center text-[10px] text-slate-500 mt-0.5 space-x-2">
                  <span className="uppercase font-semibold tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {doc.type_document.replace('_', ' ')}
                  </span>
                  <span>{formatSize(doc.taille_bytes)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition">
                <a 
                  href={doc.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  title="Voir le document"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button 
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.fichier_url)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
