import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, CheckCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function Verification() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [studentId, setStudentId] = useState('');
  const [idProof, setIdProof] = useState('');
  const [uploadingStudent, setUploadingStudent] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const setUploading = type === 'student' ? setUploadingStudent : setUploadingId;
    const setUrl = type === 'student' ? setStudentId : setIdProof;

    setUploading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUrl(data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !idProof) {
      setError('Please upload both student ID and identity proof.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/user/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIdUrl: studentId,
          idProofUrl: idProof
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setError(data.error || 'Verification submission failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error submitting verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-surface border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-taupe hover:text-primary mb-8 font-bold transition-all text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight mb-2">Get Verified</h1>
          <p className="text-taupe font-medium text-sm">Upload your credentials to unlock a verified badge and establish trust in the community.</p>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-primary">Verification Submitted!</h3>
            <p className="text-taupe text-sm">Your documents have been processed. Redirecting back to your profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Student ID Upload */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-taupe tracking-wider">Student ID Card</label>
              <div className="relative border-2 border-dashed border-white/10 hover:border-accent/40 rounded-2xl p-6 transition-all bg-background/50 flex flex-col items-center justify-center text-center">
                {studentId ? (
                  <div className="space-y-2 w-full">
                    <img src={studentId} alt="Student ID Preview" className="max-h-32 mx-auto rounded-xl object-cover border border-white/10" />
                    <button 
                      type="button" 
                      onClick={() => setStudentId('')} 
                      className="text-red-500 hover:text-red-400 text-xs font-bold block mx-auto"
                    >
                      Remove & re-upload
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-taupe mb-2" />
                    {uploadingStudent ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin mb-1" />
                    ) : (
                      <p className="text-xs text-taupe font-medium">Click to upload Student ID picture</p>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'student')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingStudent}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Govt ID Upload */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-taupe tracking-wider">Identity Proof (Aadhaar/PAN/Passport)</label>
              <div className="relative border-2 border-dashed border-white/10 hover:border-accent/40 rounded-2xl p-6 transition-all bg-background/50 flex flex-col items-center justify-center text-center">
                {idProof ? (
                  <div className="space-y-2 w-full">
                    <img src={idProof} alt="Govt ID Preview" className="max-h-32 mx-auto rounded-xl object-cover border border-white/10" />
                    <button 
                      type="button" 
                      onClick={() => setIdProof('')} 
                      className="text-red-500 hover:text-red-400 text-xs font-bold block mx-auto"
                    >
                      Remove & re-upload
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-taupe mb-2" />
                    {uploadingId ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin mb-1" />
                    ) : (
                      <p className="text-xs text-taupe font-medium">Click to upload identity document</p>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'govt')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingId}
                    />
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !studentId || !idProof}
              className="w-full py-4 bg-primary text-background font-bold rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Docs...
                </>
              ) : (
                'Submit for Verification'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
