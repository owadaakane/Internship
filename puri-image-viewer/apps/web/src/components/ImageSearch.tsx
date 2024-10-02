import React from 'react';
import Button from './Button';
import styles from './ImageSearch.module.scss';
import ImageList from './ImageList';
import { CustomImage } from '@web/types/types';

interface ImageData {
  name: string;
  url: string;
}

interface ImageSearchProps {
  images: CustomImage[];
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
      <ImageList images={images} handleImageClick={handleImageClick} />
    </div>
  );
};

export default ImageSearch;
