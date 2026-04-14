import ProductBasePage from "./ProductBasePage";

const InventoryPage = () => {
  return (
    <ProductBasePage 
      title="Inventory" 
      templateName="inventory"
      defaultDrawerView="inventory"
    />
  );
};

export default InventoryPage;
