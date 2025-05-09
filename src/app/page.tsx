"use client";

import React, { useEffect, useState } from "react";
import STLViewer from "@/app/components/STLViewer";

export default function STLViewerDemo() {
  // Example model URLs - you would replace these with actual models
  const demoModels = [
    {
      name: "4SHAUL",
      // Using an external sample STL file
      url: "/models/dcenter.stl",
    },
  ];

  //   const [selectedModel, setSelectedModel] = useState(demoModels[0]);
  const selectedModel = demoModels[0];
  const [viewerWidth, setViewerWidth] = useState(600);
  const [viewerHeight, setViewerHeight] = useState(400);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setViewerWidth(width);
    setViewerHeight(height);
  }, []);

  return (
    <div className="container h-full w-full">
      <STLViewer
        url={selectedModel.url}
        width={viewerWidth}
        height={viewerHeight}
        backgroundColor={"#f5f5f5"}
        modelColor={"#ffffff"}
      />
    </div>
  );
}
