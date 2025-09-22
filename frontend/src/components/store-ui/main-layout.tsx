import React from "react";

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className=" flex relative items-center mt-20  flex-col gap-4 justify-start">
      {children}
    </div>
  );
};

export default MainLayout;
