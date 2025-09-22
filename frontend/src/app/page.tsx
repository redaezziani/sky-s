import MainLayout from "@/components/store-ui/main-layout";

const Page = () => {
  return (
    <MainLayout>
      <img
        src={
          "https://s3.amazonaws.com/images.gearjunkie.com/uploads/2020/06/RBell_Slovenia_SB140-700x467.jpg"
        }
        className="w-full h-[400px] object-cover "
        alt="Banner"
      />
    </MainLayout>
  );
};

export default Page;
