"use client";

import { ImageProps } from "next/image";
import BlurImage from "#/ui/blur-image";
import useMediaQuery from "#/lib/hooks/use-media-query";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

export default function ZoomImage(
  props: ImageProps & { blurDataURL?: string },
) {
  const { isDesktop } = useMediaQuery();
  return (
    <figure className="not-prose flex flex-col items-center justify-center space-y-3">
      <Zoom zoomMargin={isDesktop ? 45 : undefined}>
        <BlurImage
          {...props}
          className="rounded-lg border border-gray-200"
          placeholder="blur"
          blurDataURL={
            props.blurDataURL ||
            "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
          }
        />
      </Zoom>
      <figcaption className="text-center text-sm italic text-gray-500">
        {props.alt}
      </figcaption>
    </figure>
  );
}
