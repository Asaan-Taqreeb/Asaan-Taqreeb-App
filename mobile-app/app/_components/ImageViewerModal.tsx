import React from 'react';
import ImageViewing from 'react-native-image-viewing';

type Props = {
  visible: boolean;
  images: string[];
  index?: number;
  onRequestClose: () => void;
};

export default function ImageViewerModal({ visible, images, index = 0, onRequestClose }: Props) {
  const data = images.map((uri) => ({ uri }));

  return (
    <ImageViewing
      images={data}
      imageIndex={index}
      visible={visible}
      onRequestClose={onRequestClose}
    />
  );
}
