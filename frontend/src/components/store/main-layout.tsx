import React from "react";

interface MainLayoutProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

const MainLayout = ({ children, title, description }: MainLayoutProps) => {
  return (
    <div className=" flex relative max-w-[110rem] w-full items-center mt-5 md:mt-24  flex-col gap-4 justify-start">
      <div className="flex  w-full px-4 flex-col gap-1 justify-start items-start">
        <h1 className="text-lg ">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
};

export default MainLayout;
