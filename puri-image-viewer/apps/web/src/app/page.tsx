// 画像検索・表示ページ
'use client';

import styles from './page.module.scss';
import { useCallback, useEffect, useState } from 'react';
import authStore from '@web/stores/authStore';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { API_BASE_URL } from '@web/constants';
import Loading from '@web/components/Loading';
import Button from '@web/components/Button';
import Image from 'next/image';

type CustomImage = {
  readonly size: number;
  readonly name: string;
  readonly lastModified: Date;
  readonly url: string;
};

export default function Page() {
  const router = useRouter();
  const idToken = useStore(authStore, (state) => state.idToken);
  const [inputSealId, setInputSealId] = useState('');
  const [images, setImages] = useState<CustomImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      e.preventDefault();
      if (!idToken || idToken.expired) {
        router.replace('/login');
        return;
      }
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
        return;
      }
      const result = (await response.json()) as CustomImage[];
      setImages(result);
      setIsLoading(false);
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
    <>
      {isLoading && <Loading />}
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            id='sealId'
            type='text'
            placeholder='id'
            onChange={(e) => setInputSealId(e.target.value)}
            className={styles.input}
          />
          <Button buttonName='Search' />
        </form>
        <div className={styles.imagesContainer}>
          {images.map((image, index) => (
            <div
              key={image.name}
              onClick={() => handleImageClick(index)}
              className={styles.imageWrapper}
            >
              <Image
                loader={() => image.url}
                src='placeholder.png'
                alt={image.name}
                width={200}
                height={200}
                className={styles.image}
                objectFit='cover'
              />
            </div>
          ))}
        </div>
      </div>
      {selectedImageIndex !== null && (
        <div className={styles.overlay}>
          <button className={styles.closeButton} onClick={handleCloseModal}>
            &times;
          </button>
          <button className={styles.prevButton} onClick={handlePrevImage}>
            &lt;
          </button>
          <div className={styles.modal}>
            <Image
              loader={() => images[selectedImageIndex]?.url || ''}
              src='placeholder.png'
              alt={images[selectedImageIndex]?.name || 'Image'}
              width={800}
              height={0} // heightは自動計算
              className={styles.modalImage}
              objectFit='contain'
              layout='intrinsic'
              sizes='(max-height: 100vh) 100vh' // 画像の高さが画面の高さを超えたら画面の高さに合わせる ようにしたい
            />
          </div>
          <button className={styles.nextButton} onClick={handleNextImage}>
            &gt;
          </button>
        </div>
      )}
    </>
  );
}
