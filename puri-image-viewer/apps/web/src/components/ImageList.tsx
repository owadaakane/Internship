import React from 'react';
import Image from 'next/image';
import styles from './ImageList.module.scss';
import { CustomImage } from '@web/types/types';

type ImageListProps = {
  images: CustomImage[];
  handleImageClick: (index: number) => void;
};

const ImageList: React.FC<ImageListProps> = ({ images, handleImageClick }) => {
  return (
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
  );
};

export default ImageList;
