import ProductBasePage from './ProductBasePage';

const NonInventoryPage = () => {
  return (
    <ProductBasePage 
      title="Non-inventory" 
      templateName="Non-inventory"
      defaultDrawerView="non-inventory"
    />
  );
};

export default NonInventoryPage;
