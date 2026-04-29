"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { photoUrl } from "@/lib/api/media";

type Props = { beforeKey: string; afterKey: string };

export function BeforeAfterCompare({ beforeKey, afterKey }: Props) {
  return (
    <ReactCompareSlider
      itemOne={
        <ReactCompareSliderImage
          src={photoUrl(beforeKey, "full")}
          alt="Before"
        />
      }
      itemTwo={
        <ReactCompareSliderImage
          src={photoUrl(afterKey, "full")}
          alt="After"
        />
      }
      style={{
        width: "100%",
        aspectRatio: "16 / 10",
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
}
