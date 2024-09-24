import Image from 'next/image';
import React from 'react';
import Button from './Button';
import styles from './ImageSearch.module.scss';

interface ImageData {
  name: string;
  url: string;
}

interface ImageSearchProps {
  images: ImageData[];
  setInputSealId: (value: string) => void;
  handleImageClick: (index: number) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ImageSearch: React.FC<ImageSearchProps> = ({
  images,
  setInputSealId,
  handleImageClick,
  handleSubmit,
}) => {
  return (
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
  );
};

export default ImageSearch;
