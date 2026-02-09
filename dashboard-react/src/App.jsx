import React from "react";
import BrandHeader from "./header/name/BrandHeader";
import Body from "./body";

export default function App() {
  return (
    <>
      <BrandHeader />
      <main className="pageContent">
       <Body/>
      </main>
    </>
  );
}