// 画像検索・表示ページ
'use client';

import { useCallback, useEffect, useState } from 'react';
import authStore from '@web/stores/authStore';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { API_BASE_URL } from '@web/constants';
import Loading from '@web/components/Loading';
import ImageModal from '@web/components/ImageModal';
import ImageSearch from '@web/components/ImageSearch';
import { loadingStore } from '@web/stores/loadingStore';

type CustomImage = {
  readonly size: number;
  readonly name: string;
  readonly lastModified: Date;
  readonly url: string;
};

export default function Page() {
  const router = useRouter();
  const idToken = useStore(authStore, (state) => state.idToken);
  const isLoading = useStore(loadingStore, (state) => state.isLoading);
  const setLoading = useStore(loadingStore, (state) => state.setLoading);
  const [inputSealId, setInputSealId] = useState('');
  const [images, setImages] = useState<CustomImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    authStore.persist.onFinishHydration((auth) => {
      if (!auth.idToken || auth.idToken.expired) {
        router.replace('/login');
      }
    });
    authStore.persist.rehydrate();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      setLoading(true);
      e.preventDefault();
      if (!idToken || idToken.expired) {
        router.replace('/login');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/seals/${inputSealId}/images`,
          {
            method: 'GET',
            headers: {
              Authorization: idToken?.raw,
            },
          }
        );
        if (!response.ok) {
          setImages([]);
          setLoading(false);
          return;
        }
        const result = (await response.json()) as CustomImage[];
        setImages(result);
      } catch (error) {
        console.error('Error:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    },
    [inputSealId, idToken]
  );

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <div>
      {isLoading && <Loading />}
      <ImageSearch
        images={images}
        setInputSealId={setInputSealId}
        handleImageClick={handleImageClick}
        handleSubmit={handleSubmit}
      />
      {selectedImageIndex !== null && (
        <ImageModal
          images={images}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseModal}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />
      )}
    </div>
  );
}
