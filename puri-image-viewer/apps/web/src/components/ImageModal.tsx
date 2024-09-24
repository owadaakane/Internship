import Image from 'next/image';
import React from 'react';
import styles from './ImageModal.module.scss';

interface ImageData {
  name: string;
  url: string;
}

interface ImageModalProps {
  images: ImageData[];
  currentImageIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentImageIndex,
  onClose,
  onPrev,
  onNext,
}) => {
  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>
      <button className={styles.prevButton} onClick={onPrev}>
        &lt;
      </button>
      <div className={styles.modal}>
        <Image
          loader={() => images[currentImageIndex]?.url || ''}
          src='placeholder.png'
          alt={images[currentImageIndex]?.name || 'Image'}
          width={800}
          height={0} // heightは自動計算
          className={styles.modalImage}
          objectFit='contain'
          layout='intrinsic'
          sizes='(max-height: 100vh) 100vh' // 画像の高さが画面の高さを超えたら画面の高さに合わせる
        />
      </div>
      <button className={styles.nextButton} onClick={onNext}>
        &gt;
      </button>
    </div>
  );
};

export default ImageModal;
