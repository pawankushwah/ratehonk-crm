import React, { useEffect } from 'react'
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";

import { Upload, Trash2, Pencil } from "lucide-react";


import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Products = {
  size: string;
  color: string;
  price: number;
};

const data: Products[] = [
  { size: "SM", color: "red", price: 1000 },
  { size: "SM", color: "blue", price: 1100 },
  { size: "MD", color: "red", price: 1200 },
  { size: "MD", color: "blue", price: 1300 },
  { size: "LG", color: "black", price: 1500 },
];
const leadSchema = z.object({
    //   leadTypeId: z.string().min(1, "Lead type is required"),
    firstName: z.string().min(1, "First name is required"),
    //   lastName: z.string().optional(),
    //   customerId: z.string().optional(),
    //   leadId: z.string().optional(),
    //   email: z
    //     .string()
    //     .email("Please enter a valid email address")
    //     .optional()
    //     .or(z.literal("")),
    //   country: z.string().optional(),
    //   state: z.string().optional(),
    //   city: z.string().optional(),
    //   phone: z.string().optional(),
    //   source: z.string().optional(),
    //   status: z.string().default("new"),
    //   notes: z.string().optional(),
    //   budgetRange: z.string().optional(),
    //   priority: z.string().default("medium"),
    //   typeSpecificData: z.record(z.any()).optional(),
    //   dynamicData: z.record(z.any()).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

const Retail = () => {
    const [open, setOpen] = useState(false)
    const [openList, setOpenList] = useState(false)

    const [selected, setSelected] = useState<number | null>(null);
    const [selectedMultipleData, setSelectedMultipleData] = useState<any>([]);


    useEffect(()=>{
     console.log(selected,"selected")
    },[selected])



    function handleSubmit(data: any) {
        console.log(data)
    }
    return (
      <div>
        <FilterSidebar>
<div className="bg-white p-4">
            <div className="mx-auto lg:max-w-7xl md:max-w-4xl sm:max-w-xl max-sm:max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-6 sm:mb-8">Product Management</h2>
                <Button
                    // variant="outline"
                    onClick={() => setOpen(true)}
                   
                >
                    {/* <RefreshCw className="h-4 w-4" /> */}
                    Add Product/Service
                </Button>
                <Card />
            </div>

            <Sheet open={open} onOpenChange={() => {

                if(selected)
                {
                  setSelected(null)
                }
                else
                {
                setOpen(!open)
                }
            
            }} >
               
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                     <SheetHeader>
                         <SheetTitle className="flex mt-[-12px]">Product/Service Information</SheetTitle>
                </SheetHeader>
                     <br/>
                    <ProductTypeSelector selected={selected} setSelected={setSelected}/>
                     
                   {selected?<> <div
                       
                        className={`flex gap-2 items-center  cursor-pointer transition-all "
                                
                            
            `}
                    >
                        {/* Icon */}
                        <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center h-[40px] w-[40px]">
                            {options[selected - 1].icon}
                        </div>

                        {/* Content */}
                        <div>
                            <h3 className="font-semibold text-gray-800">
                                {options[selected - 1].title}
                            </h3>
                        </div>
                    </div></>



:""}
 <br/>

 {/* <Accordion type="single" collapsible>
                <AccordionItem value="dynamic-fields">
                  <AccordionTrigger className="text-xs font-semibold">
                    Additional Fields 
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-12 gap-3 pt-2">
                      hfghhfgf
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="dynamic-fields2">
                  <AccordionTrigger className="text-xs font-semibold">
                    Additional 2 
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-12 gap-3 pt-2">
                      hfghhfgf
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion> */}
             { selected == 1?<ProductFormFull setOpenList={setOpenList} openList={openList} selectedMultipleData={selectedMultipleData} setSelectedMultipleData={setSelectedMultipleData} />:""}
             {selected == 2?<NonInventoryForm onCancel={()=>setSelected(null)} onSubmit={(data:any)=>console.log(data)}/>: ""}
             {selected == 3?<NonInventoryForm onCancel={()=>setSelected(null)} onSubmit={(data:any)=>console.log(data)}/>: ""}


                    

                    {/* <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => handleSubmit(data))}
                            className="space-y-3">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter first name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form> */}
                </SheetContent>

            </Sheet>

               <Dialog open={openList} onOpenChange={()=>setOpenList(false)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sizes Available</DialogTitle>
                      </DialogHeader>
                         <div className="p-6">
      <div className="overflow-x-auto rounded-2xl shadow border border-gray-200">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Size</th>
              <th className="px-6 py-3">Color</th>
              <th className="px-6 py-3">Price (₹)</th>
            </tr>
          </thead>

          <tbody>
            {selectedMultipleData.map((item, index) => (
              <tr
                key={index}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium">{item.size}</td>

                <td className="px-6 py-4 flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.color}
                </td>

                <td className="px-6 py-4 font-semibold text-green-600">
                  ₹{item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
                      </DialogContent>
                      </Dialog>
        </div>

          </FilterSidebar>
        </div>
    )
}

export default Retail



type Variant = {
    size: string;
    color: string;
    price: number;
};

type Product = {
    id: number;
    name: string;
    image: string;
    description: string;
    variants: Variant[];
};

type SelectionState = {
    [productId: number]: {
        size?: string;
        color?: string;
    };
};

/* ================= COMPONENT ================= */

const Card: React.FC = () => {
    const products: Product[] = [
        {
            id: 1,
            name: "RODEIZ Men Slim Fit Checkered Spread Collar Casual Shirt",
            image: "https://rukminim2.flixcart.com/image/2518/2518/xif0q/shirt/l/2/t/l-flat-check-cream-rodeiz-original-imah9b9tgd2gtgrd.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "SM", color: "red", price: 1000 },
                { size: "SM", color: "blue", price: 1100 },
                { size: "MD", color: "red", price: 1200 },
                { size: "MD", color: "blue", price: 1300 },
                { size: "LG", color: "black", price: 1500 }
            ]
        },
        {
            id: 2,
            name: "RODEIZ Men Slim Fit Checkered Spread Collar Casual Shirt",
            image: "https://rukminim2.flixcart.com/image/2518/2518/xif0q/shirt/t/y/i/4xl-check-006-white-rodeiz-original-imahk25r9fnhr2xx.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "SM", color: "white", price: 900 },
                { size: "MD", color: "white", price: 1100 },
                { size: "MD", color: "black", price: 1200 }
            ]
        },
        {
            id: 3,
            name: "VELLOSTA Men Regular Fit Self Design Spread Collar Casual Shirt",
            image: "https://rukminim2.flixcart.com/image/2518/2518/xif0q/shirt/p/m/t/l-hngr1pe1beige-chax-shirt-vellosta-original-imahkysyxv7adfhq.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "MD", color: "brown", price: 1400 },
                { size: "LG", color: "black", price: 1600 }
            ]
        },  {
            id: 4,
            name: "Spela Men Regular Fit Solid Button Down Collar Casual Shirt",
            image: "https://rukminim2.flixcart.com/image/3456/3456/xif0q/shirt/p/b/g/m-btc02-spela-original-imahhcsr6v3fm2rt.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "SM", color: "red", price: 1000 },
                { size: "SM", color: "blue", price: 1100 },
                { size: "MD", color: "red", price: 1200 },
                { size: "MD", color: "blue", price: 1300 },
                { size: "LG", color: "black", price: 1500 }
            ]
        },
        {
            id: 5,
            name: "Force Men Printed Round Neck Cotton Blend Black T-Shirt",
            image: "https://rukminim2.flixcart.com/image/3456/3456/xif0q/t-shirt/n/r/j/l-fmt483-newyork-bk-force-original-imahj3hmhzttvjbs.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "SM", color: "white", price: 900 },
                { size: "MD", color: "white", price: 1100 },
                { size: "MD", color: "black", price: 1200 }
            ]
        },
        {
            id: 6,
            name: "London Hills Men Solid Round Neck Cotton Blend White T-Shirt",
            image: "https://rukminim2.flixcart.com/image/3456/3456/xif0q/t-shirt/a/y/y/xxl-london-hills-solid-men-round-neck-white-t-shirt-original-imah47mthdbhekye.jpeg?q=90",
            description: "Lorem ipsum dolor sit amet",
            variants: [
                { size: "MD", color: "brown", price: 1400 },
                { size: "LG", color: "black", price: 1600 }
            ]
        }
    ];

    const [selection, setSelection] = useState<SelectionState>({});

    /* ================= HANDLERS ================= */

    const handleSelect = (
        productId: number,
        type: "size" | "color",
        value: string
    ) => {
        setSelection((prev) => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [type]: value
            }
        }));
    };

    /* ================= HELPERS ================= */

    const getSizes = (product: Product): string[] => {
        return Array.from(new Set(product.variants.map((v) => v.size)));
    };

    const getColors = (product: Product, size: string): string[] => {
        return Array.from(
            new Set(
                product.variants
                    .filter((v) => v.size === size)
                    .map((v) => v.color)
            )
        );
    };

    const getPrice = (
        product: Product,
        size: string,
        color: string
    ): number => {
        const variant = product.variants.find(
            (v) => v.size === size && v.color === color
        );
        return variant?.price ?? product.variants[0].price;
    };

    /* ================= UI ================= */

    return (
        <div className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                    const selected = selection[product.id] || {};

                    const sizes = getSizes(product);
                    const selectedSize = selected.size || sizes[0];

                    const colors = getColors(product, selectedSize);
                    const selectedColor = selected.color || colors[0];

                    const price = getPrice(product, selectedSize, selectedColor);

                    return (
                        <div
                            key={product.id}
                            className="bg-white shadow border rounded-lg p-3"
                        >
                            {/* Image */}
                            <div className="aspect-[12/11] bg-gray-100 rounded-lg p-4">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Title + Price */}
                            <div className="flex mt-4">
                                <h5 className="font-semibold">{product.name}</h5>
                                <h6 className="ml-auto font-bold">₹{price}</h6>
                            </div>

                            {/* Sizes */}
                            <div className="mt-3">
                                <p className="text-sm font-semibold">Sizes</p>
                                <div className="flex gap-2 mt-2">
                                    {sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() =>
                                                handleSelect(product.id, "size", size)
                                            }
                                            className={`px-3 py-1 border rounded ${selectedSize === size
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-300"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="mt-3">
                                <p className="text-sm font-semibold">Colors</p>
                                <div className="flex gap-2 mt-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() =>
                                                handleSelect(product.id, "color", color)
                                            }
                                            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color
                                                ? "border-black"
                                                : "border-gray-300"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            {/* <p className="text-sm text-gray-600 mt-2">
                                {product.description}
                            </p> */}

                            {/* Actions */}
                            {/* <Button variant="outline" className="w-full mt-4">
                                Add to cart
                            </Button> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// export default ProductGrid;

// import React, { useState } from "react";
import { Shirt, Box, Wrench, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { expenses } from '../../../shared/schema';

// import { DialogHeader } from '@/components/ui/dialog';

type OptionType = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
};

const options: OptionType[] = [
    {
        id: "1",
        title: "Inventory",
        description:
            "Products you buy and/or sell and that you track quantities of.",
        icon: <Shirt size={28} />,
    },
    {
        id: "2",
        title: "Non-inventory",
        description:
            "Products you buy and/or sell but don’t need to track quantities of.",
        icon: <Box size={28} />,
    },
    {
        id: "3",
        title: "Service",
        description:
            "Services that you provide to customers, for example, tax preparation.",
        icon: <Wrench size={28} />,
    },
    {
        id: "4",
        title: "Bundle",
        description:
            "A collection of products and/or services that you sell together.",
        icon: <Package size={28} />,
    },
];

const ProductTypeSelector: any= ({selected, setSelected}:any) => {

    return (
        <div className="">
            {/* Header */}


            {/* Options */}
          {selected == null?  <div>
                {options.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelected(item.id)}
                        className={`flex gap-4 p-4 mt-2 cursor-pointer border-b transition-all rounded-xl border
              ${selected === item.id
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "hover:bg-gray-50"
                            }
            `}
                    >
                        {/* Icon */}
                        <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center h-[40px] w-[40px]">
                            {item.icon}
                        </div>

                        {/* Content */}
                        <div>
                            <h3 className="font-semibold text-gray-800">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>:""}
        </div>
    );
};




const schema = z.object({
  name: z.string().min(1, "Required"),
  sku: z.string().optional(),
  category: z.string().optional(),

  quantity: z.string().min(1),
  asOfDate: z.string(),
  reorderPoint: z.string().optional(),

  inventoryAccount: z.string().optional(),

  description: z.string().optional(),

  salesPrice: z.string().optional(),
  incomeAccount: z.string().optional(),
  isSalesTaxIncluded: z.boolean().optional(),
  salesTax: z.string().optional(),

  purchaseDescription: z.string().optional(),
  cost: z.string().optional(),
  expenseAccount: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),

  // ✅ NEW FIELDS
  isPurchaseTaxIncluded: z.boolean().optional(),
  purchaseTax: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ProductFormFull({
  onSubmit,
  onCancel,
  setOpenList,openList,selectedMultipleData, setSelectedMultipleData
}: any) {
  const [image, setImage] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      quantity: "0",
      asOfDate: "",
      reorderPoint: "",
      inventoryAccount: "",
      description: "",
      salesPrice: "",
      incomeAccount: "",
      isSalesTaxIncluded: false,
      salesTax: "",
      purchaseDescription: "",
      cost: "",
      size:"",
      color:"",
      expenseAccount: "",
      isPurchaseTaxIncluded: false,
      purchaseTax: "",
    },
  });

  // IMAGE UPLOAD
  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-[620px]  "
      >
        {/* HEADER */}

        {/* NAME + IMAGE */}
        <div className="flex gap-4  items-center ">
          <div className="flex-1 space-y-3 ">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* IMAGE */}
          
        </div>
        
        

        {/* CATEGORY */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { value: "electronics", label: "Electronics" },
                    { value: "clothing", label: "Clothing" },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Choose category"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* INVENTORY */}
        <br/>
        <div className='border  p-2 rounded bg-white relative'>
            <Button className='radius-[100%] absolute top-[-20px] right-[-20px]' onClick={()=>setOpenList(true)}>{selectedMultipleData?.length}</Button>
         <div className="w-[120px] mt-[25px]">
            <div className="border rounded-md h-[100px] flex items-center justify-center bg-gray-50">
              {image ? (
                <img src={image} className="h-full object-contain" />
              ) : (
                <Upload className="text-gray-400" />
              )}
            </div>

            <div className="flex justify-center gap-2 mt-2">
              <label className="cursor-pointer">
                <Pencil size={16} />
                <input type="file" hidden onChange={handleImageUpload} />
              </label>
              <button type="button" onClick={() => setImage(null)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
<br/>
        <div className="grid grid-cols-2 gap-3 ">
          
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial quantity *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="asOfDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>As of date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reorderPoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reorder point</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

         <div className="grid grid-cols-2 gap-3">
          
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expenseAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense account</FormLabel>
                <FormControl>
                  <Combobox
                    options={[{ value: "cogs", label: "COGS" }]}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <Combobox
                    options={[{ value: "SM", label: "SM" },{ value: "MD", label: "MD" },{ value: "LG", label: "LG" }]}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button onClick={()=>{
            console.log(form.getValues())
            console.log(image)

            let newObject = {
              color:form.getValues().color,
              size:form.getValues().size,
              price:form.getValues().cost,
              asOfDate:form.getValues().asOfDate,
              reorderPoint:form.getValues().reorderPoint,
              expenseAccount:form.getValues().expenseAccount,
              intialQuantity:form.getValues().quantity,
              image
            }

            selectedMultipleData.push(newObject)
              setSelectedMultipleData([...selectedMultipleData])
          }}>Add</Button>

        </div>
</div>
<br/>
        {/* SALES */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="salesPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="incomeAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Income account</FormLabel>
                <FormControl>
                  <Combobox
                    options={[{ value: "sales", label: "Sales Income" }]}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* SALES TAX */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.watch("isSalesTaxIncluded")}
            onCheckedChange={(val) =>
              form.setValue("isSalesTaxIncluded", !!val)
            }
          />
          <span className="text-sm">Inclusive of sales tax</span>
        </div>

        <FormField
          control={form.control}
          name="salesTax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Tax</FormLabel>
              <FormControl>
                <Combobox
                  options={[{ value: "gst", label: "GST 18%" }]}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* PURCHASE */}
        <FormField
          control={form.control}
          name="purchaseDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

       

        {/* ✅ PURCHASE TAX (NEW) */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.watch("isPurchaseTaxIncluded")}
            onCheckedChange={(val) =>
              form.setValue("isPurchaseTaxIncluded", !!val)
            }
          />
          <span className="text-sm">Inclusive of purchase tax</span>
        </div>

        <FormField
          control={form.control}
          name="purchaseTax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Tax</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { value: "gst5", label: "GST 5%" },
                    { value: "gst18", label: "GST 18%" },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select tax"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save and close</Button>
        </div>
      </form>
    </Form>
  );
}




const schema2 = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),

  description: z.string().optional(),
  salesPrice: z.string().optional(),
  incomeAccount: z.string().optional(),
  isSalesTaxIncluded: z.boolean().optional(),
  salesTax: z.string().optional(),

  enablePurchase: z.boolean().optional(),
  purchaseDescription: z.string().optional(),
  cost: z.string().optional(),
  expenseAccount: z.string().optional(),
});

type FormData2 = z.infer<typeof schema>;

function NonInventoryForm({
  onSubmit,
  onCancel,
}: any) {
  const [image, setImage] = useState<string | null>(null);

  const form = useForm<FormData2>({
    resolver: zodResolver(schema2),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      description: "",
      salesPrice: "0",
      incomeAccount: "services",
      isSalesTaxIncluded: false,
      salesTax: "",
      enablePurchase: false,
    },
  });

  const enablePurchase = form.watch("enablePurchase");

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div >
      <div >
        {/* HEADER */}
       

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className=""
          >
            

            {/* NAME + IMAGE */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* IMAGE */}
              <div className="w-[120px] mt-[25px]">
                <div className="h-[100px] border rounded flex items-center justify-center bg-gray-50">
                  {image ? (
                    <img src={image} className="h-full object-contain" />
                  ) : (
                    <Upload className="text-gray-400" />
                  )}
                </div>

                <div className="flex justify-center gap-2 mt-2">
                  <label className="cursor-pointer">
                    <Pencil size={16} />
                    <input hidden type="file" onChange={handleImageUpload} />
                  </label>
                  <button type="button" onClick={() => setImage(null)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* CATEGORY */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Combobox
                      options={[
                        { label: "Services", value: "services" },
                        { label: "Design", value: "design" },
                      ]}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Choose a category"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked />
                <span className="text-sm">
                  I sell this product/service
                </span>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Description on sales forms"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* SALES */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="salesPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales price/rate</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incomeAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income account</FormLabel>
                    <FormControl>
                      <Combobox
                        options={[
                          { label: "Services", value: "services" },
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* SALES TAX */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.watch("isSalesTaxIncluded")}
                onCheckedChange={(val) =>
                  form.setValue("isSalesTaxIncluded", !!val)
                }
              />
              <span className="text-sm">Inclusive of sales tax</span>
            </div>

            <FormField
              control={form.control}
              name="salesTax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Tax</FormLabel>
                  <FormControl>
                    <Combobox
                      options={[
                        { label: "GST 18%", value: "gst18" },
                      ]}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select tax"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* PURCHASE TOGGLE */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={enablePurchase}
                  onCheckedChange={(val) =>
                    form.setValue("enablePurchase", !!val)
                  }
                />
                <span className="text-sm">
                  I purchase this product/service from a supplier
                </span>
              </div>
            </div>

            {/* CONDITIONAL PURCHASE SECTION */}
            {enablePurchase && (
              <div className="space-y-3 border-t pt-3">
                <FormField
                  control={form.control}
                  name="purchaseDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expenseAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense account</FormLabel>
                        <FormControl>
                          <Combobox
                            options={[
                              { label: "COGS", value: "cogs" },
                            ]}
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-green-600">
                Save and close
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}



const FilterSidebar: React.FC = ({children}:any) => {
  const [gender, setGender] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [discount, setDiscount] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(750);

  const toggleItem = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const clearAll = () => {
    setGender("");
    setCategories([]);
    setBrands([]);
    setColors([]);
    setDiscount("");
    setMinPrice(0);
    setMaxPrice(750);
  };

  const selectedFilters = [
    ...categories,
    ...brands,
    ...colors,
    gender,
    discount,
  ].filter(Boolean);

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-full max-w-[280px] shrink-0 py-6">
        <div className="flex items-center border-b border-gray-300 pb-4 px-6">
          <h3 className="text-slate-900 text-lg font-semibold">Filter</h3>
          <button
            onClick={clearAll}
            className="text-sm text-red-500 font-semibold ml-auto"
          >
            Clear all
          </button>
        </div>

        <div className="border-r border-gray-300 divide-y divide-gray-300">
          {/* Gender */}
          <div className="p-6">
            {["Men", "Women", "Boys", "Girls"].map((item) => (
              <label key={item} className="flex items-center gap-3 mb-3">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === item}
                  onChange={() => setGender(item)}
                />
                {item}
              </label>
            ))}
          </div>

          {/* Categories */}
          <div className="p-6">
            <h6 className="font-semibold text-sm">Categories</h6>
            {[
              "TShirts",
              "Jackets",
              "Sweaters",
              "Crossbody Bags",
              "Hair Tie",
              "Luxury Timepieces",
              "Sunglasses",
            ].map((cat) => (
              <label key={cat} className="flex gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleItem(cat, categories, setCategories)}
                />
                {cat}
              </label>
            ))}
          </div>

          {/* Brands */}
          <div className="p-6">
            <h6 className="font-semibold text-sm">Brands</h6>
            {[
              "Zara",
              "H&M",
              "Uniqlo",
              "Levi’s",
              "Nike",
              "Adidas",
              "Puma",
              "Tommy Hilfiger",
            ].map((brand) => (
              <label key={brand} className="flex gap-3 mt-3">
                <input
                  type="checkbox"
                  checked={brands.includes(brand)}
                  onChange={() => toggleItem(brand, brands, setBrands)}
                />
                {brand}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className="p-6">
            <h6 className="font-semibold text-sm">Price</h6>
            <input
              type="range"
              min={0}
              max={1000}
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="w-full mt-3"
            />
            <input
              type="range"
              min={0}
              max={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-sm mt-2">
              <span>${minPrice}</span>
              <span>${maxPrice}</span>
            </div>
          </div>

          {/* Colors */}
          <div className="p-6">
            <h6 className="font-semibold text-sm">Colors</h6>
            {["Black", "Blue", "Purple", "Orange", "Pink", "Yellow", "Red", "Green"].map(
              (color) => (
                <label key={color} className="flex gap-3 mt-3">
                  <input
                    type="checkbox"
                    checked={colors.includes(color)}
                    onChange={() => toggleItem(color, colors, setColors)}
                  />
                  {color}
                </label>
              )
            )}
          </div>

          {/* Discount */}
          <div className="p-6">
            <h6 className="font-semibold text-sm">Discount</h6>
            {["10%", "20%", "30%", "40%", "50%"].map((d) => (
              <label key={d} className="flex gap-3 mt-3">
                <input
                  type="radio"
                  name="discount"
                  checked={discount === d}
                  onChange={() => setDiscount(d)}
                />
                {d} and above
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full p-6">
        {/* Selected Filters */}
        <div className="flex flex-wrap gap-2">
          {selectedFilters.map((item, i) => (
            <span
              key={i}
              className="border px-2 py-1 text-sm rounded-md flex items-center gap-2"
            >
              {item}
              <button
                onClick={() =>
                  setCategories(categories.filter((c) => c !== item))
                }
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Products */}
         {children}
      </div>
    </div>
  );
};
