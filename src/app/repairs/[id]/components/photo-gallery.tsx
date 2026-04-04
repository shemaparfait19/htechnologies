'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X } from 'lucide-react';
import { uploadMultiplePhotos } from '@/lib/upload-service';

interface PhotoGalleryProps {
  repair: any;
  onUpdate: () => void;
}

export function PhotoGallery({ repair, onUpdate }: PhotoGalleryProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const photoUrls = await uploadMultiplePhotos(files);
      
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrls: [...(repair.photoUrls || []), ...photoUrls],
        }),
      });

      if (!response.ok) throw new Error('Failed to upload photos');

      toast({
        title: 'Photos uploaded',
        description: `${files.length} photo(s) added successfully`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      const updatedPhotos = repair.photoUrls.filter((url: string) => url !== photoUrl);
      
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrls: updatedPhotos,
        }),
      });

      if (!response.ok) throw new Error('Failed to remove photo');

      toast({
        title: 'Photo removed',
        description: 'Photo has been deleted',
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Device Photos</span>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {repair.photoUrls && repair.photoUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {repair.photoUrls.map((photoUrl: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={photoUrl}
                  alt={`Device photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(photoUrl)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No photos uploaded yet</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
