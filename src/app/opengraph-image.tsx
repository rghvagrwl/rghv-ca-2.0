import { ImageResponse } from "next/og";

export const alt = "Raghav Agarwal website thumbnail";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#DCDCDC",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            backgroundColor: "#FF5A00",
          }}
        />
      </div>
    ),
    size,
  );
}
