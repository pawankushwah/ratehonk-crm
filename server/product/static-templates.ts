export const STATIC_TEMPLATES = [
  {
    "id": "bundle",
    "name": "Bundle",
    "schema": [
      {
        "id": "1",
        "kind": "section",
        "name": "General Information",
        "items": [
          {
            "id": "1775120995358",
            "kind": "field",
            "type": "text",
            "label": "Item Name",
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775121015947",
            "kind": "field",
            "type": "sku",
            "label": "SKU ",
            "properties": {
              "prefix": "BUND",
              "editable": true,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775121037419",
            "kind": "field",
            "type": "text",
            "label": "Description",
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775121053564",
            "kind": "field",
            "type": "bundle-items",
            "label": "Included Items",
            "properties": {
              "required": true,
              "addButtonTitle": "Add Item"
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775280254128",
            "kind": "field",
            "type": "image",
            "label": "Image",
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          }
        ],
        "isRepeatable": false
      }
    ],
    "design": {
      "theme": "light",
      "styles": {
        "padding": "md",
        "fontFamily": "plus-jakarta",
        "borderRadius": "lg",
        "primaryColor": "#6366f1"
      },
      "mapping": {},
      "templateId": "simple",
      "visibility": {},
      "cardMapping": {
        "image": "1775280254128",
        "title": "1775120995358"
      },
      "cardVisibility": {
        "price": false,
        "actions": false,
        "category": false,
        "description": false
      },
      "viewTemplateId": "immersive_flowbite"
    },
    "formKey": "bundle"
  },
  {
    "id": "inventory",
    "name": "Inventory",
    "schema": [
      {
        "id": "1774592301953",
        "kind": "field",
        "type": "sku",
        "label": "S K U",
        "logic": {
          "type": "AND",
          "conditions": []
        },
        "layout": {
          "colSpan": 6
        },
        "properties": {
          "prefix": "PROD",
          "editable": true,
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774642468861",
        "kind": "field",
        "type": "addable-select",
        "label": "Category",
        "layout": {
          "colSpan": 6
        },
        "options": [
          {
            "id": "019d3642-d95a-7732-a60a-00d0880c9401",
            "label": "Electronics",
            "order": 0,
            "value": "Electronics"
          },
          {
            "id": "019d3642-d95b-74f9-aaaa-913bd3075b5a",
            "label": "Clothing",
            "order": 1,
            "value": "Clothing"
          },
          {
            "id": "019d3ad3-f6c8-7bea-8811-077bc861999b",
            "label": "Books",
            "order": 2,
            "value": "Books"
          }
        ],
        "dropdownId": "019d2e58-f364-7767-9536-b86ea988ca30",
        "properties": {
          "required": true,
          "addButtonTitle": "Add New Category"
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774624701189",
        "kind": "field",
        "type": "text",
        "label": "Product Name",
        "layout": {
          "colSpan": 12
        },
        "properties": {
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774592408283",
        "kind": "section",
        "name": "Variants",
        "locked": true,
        "disabledProperties": ["required", "type", "logic"],
        "items": [
          {
            "id": "1774607666147",
            "kind": "field",
            "type": "image",
            "label": "Image",
            "layout": {
              "colSpan": 12
            },
            "properties": {
              "required": true,
              "aspectRatio": "Free"
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774592416416",
            "kind": "field",
            "type": "number",
            "label": "Intial Quantity",
            "logic": {
              "type": "AND",
              "conditions": []
            },
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "min": 0,
              "isStock": true,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774592484746",
            "kind": "field",
            "type": "date",
            "label": "As of Date",
            "logic": {
              "type": "AND",
              "conditions": []
            },
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774593290735",
            "kind": "field",
            "type": "number",
            "label": "Reorder Point",
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774593307729",
            "kind": "field",
            "type": "number",
            "label": "Cost",
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774593326852",
            "kind": "field",
            "type": "select",
            "label": "Expanse Account",
            "layout": {
              "colSpan": 6
            },
            "options": [
              "COGS"
            ],
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774593363843",
            "kind": "field",
            "type": "number",
            "label": "Model Number",
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1774593375945",
            "kind": "field",
            "type": "select",
            "label": "Size",
            "layout": {
                "colSpan": 6
            },
            "locked": true,
            "options": [
                "S",
                "M",
                "L",
                "XL",
                "2XL",
                "3XL"
            ],
            "isCustom": false,
            "isStatic": true,
            "properties": {
                "required": true,
                "hideLabel": true
            },
            "disabledProperties": [
                "required",
                "type",
                "logic"
            ]
          },
          {
            "id": "1774593452328",
            "kind": "field",
            "type": "number",
            "label": "Sales Price",
            "layout": {
              "colSpan": 6
            },
            "properties": {
              "min": 0,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775625486949",
            "kind": "field",
            "type": "color",
            "label": "Color",
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          }
        ],
        "logic": {
          "type": "AND",
          "conditions": []
        },
        "layout": {
          "gridCols": 1
        },
        "isRepeatable": true
      },
      {
        "id": "1774593958616",
        "kind": "field",
        "type": "checkbox",
        "label": "tax inclusion",
        "options": [
          "Inclusive of sales tax"
        ],
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774594002449",
        "kind": "field",
        "type": "select",
        "label": "Sales Tax",
        "options": [
          "GST 18%"
        ],
        "properties": {
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774594031376",
        "kind": "field",
        "type": "textarea",
        "label": "Purchase Description",
        "properties": {
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774594098959",
        "kind": "field",
        "type": "checkbox",
        "label": "purchase inclusion",
        "options": [
          "Inclusive of purchase tax"
        ],
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774594130965",
        "kind": "field",
        "type": "select",
        "label": "Purchase Tax",
        "options": [
          "GST 5%",
          "GST 18%"
        ],
        "properties": {
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1774593482378",
        "kind": "field",
        "type": "select",
        "label": "Income Account",
        "options": [
          "Sales Income"
        ],
        "properties": {
          "required": true
        },
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      },
      {
        "id": "1775487896179",
        "kind": "field",
        "type": "key-value",
        "label": "Key Highlights",
        "locked": true,
        "disabledProperties": ["required", "type", "logic"]
      }
    ],
    "design": {
      "theme": "light",
      "styles": {
        "padding": "md",
        "fontFamily": "plus-jakarta",
        "borderRadius": "lg",
        "primaryColor": "#6366f1"
      },
      "mapping": {},
      "templateId": "universal",
      "visibility": {},
      "cardMapping": {
        "sku": "1774592301953",
        "image": "1774607666147",
        "price": "1774593452328",
        "title": "1774624701189",
        "colors": "1775625486949",
        "category": "1774642468861",
        "description": "1774594031376",
        "variantsSection": "1774592408283"
      },
      "viewMapping": {
        "sku": "1774592301953",
        "image": "1774607666147",
        "price": "1774593452328",
        "sizes": "1774593375945",
        "title": "1774624701189",
        "colors": "1775625486949",
        "highlights": "1775487896179",
        "description": "1774594031376",
        "variantsSection": "1774592408283"
      },
      "cardVisibility": {
        "price": true,
        "sizes": false,
        "colors": true,
        "category": true,
        "highlights": false,
        "description": false,
        "reviewCount": false,
        "variantsSection": false
      },
      "viewTemplateId": "immersive_flowbite"
    },
    "formKey": "inventory"
  },
  {
    "id": "non-inventory",
    "name": "Non-inventory",
    "schema": [
      {
        "id": "1",
        "kind": "section",
        "name": "General Information",
        "items": [
          {
            "id": "1775280289375",
            "kind": "field",
            "type": "image",
            "label": "Image",
            "properties": {
              "required": true,
              "aspectRatio": "Free"
            },
            "locked": true,
            "disabledProperties": ["required", "type"]
          },
          {
            "id": "1775120319964",
            "kind": "field",
            "type": "text",
            "label": "Item Name",
            "layout": {
              "colSpan": 12
            },
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120336580",
            "kind": "field",
            "type": "sku",
            "label": "SKU",
            "layout": {
              "colSpan": 12
            },
            "properties": {
              "prefix": "NINV",
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120364912",
            "kind": "field",
            "type": "addable-select",
            "label": "Category",
            "layout": {
              "colSpan": 12
            },
            "options": [
              {
                "id": "019d3642-d95a-7732-a60a-00d0880c9401",
                "label": "Electronics",
                "order": 0,
                "value": "Electronics"
              },
              {
                "id": "019d3642-d95b-74f9-aaaa-913bd3075b5a",
                "label": "Clothing",
                "order": 1,
                "value": "Clothing"
              },
              {
                "id": "019d3ad3-f6c8-7bea-8811-077bc861999b",
                "label": "Books",
                "order": 2,
                "value": "Books"
              }
            ],
            "dropdownId": "019d2e58-f364-7767-9536-b86ea988ca30",
            "properties": {
              "required": true,
              "addButtonTitle": "Add new category"
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120403456",
            "kind": "field",
            "type": "number",
            "label": "Purchase Cost",
            "layout": {
              "colSpan": 12
            },
            "properties": {
              "min": 0,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120423797",
            "kind": "field",
            "type": "number",
            "label": "Sales Price",
            "layout": {
              "colSpan": 12
            },
            "properties": {
              "min": 0,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120477038",
            "kind": "field",
            "type": "text",
            "label": "Description",
            "layout": {
              "colSpan": 12
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          }
        ],
        "isRepeatable": false
      }
    ],
    "design": {
      "theme": "light",
      "styles": {
        "padding": "md",
        "fontFamily": "plus-jakarta",
        "borderRadius": "lg",
        "primaryColor": "#6366f1"
      },
      "mapping": {},
      "templateId": "universal",
      "visibility": {},
      "cardMapping": {
        "sku": "1775120336580",
        "image": "1775280289375",
        "price": "1775120423797",
        "title": "1775120319964",
        "category": "1775120364912",
        "description": "1775120477038"
      },
      "viewMapping": {
        "sku": "1775120336580",
        "image": "1775280289375",
        "price": "1775120423797",
        "title": "1775120319964",
        "description": "1775120477038"
      },
      "cardVisibility": {
        "description": false
      },
      "viewTemplateId": "immersive_flowbite",
      "viewVisibility": {
        "sizes": false,
        "colors": false,
        "rating": false,
        "actions": false,
        "highlights": false,
        "reviewCount": false,
        "variantsSection": false
      }
    },
    "formKey": "non-inventory"
  },
  {
    "id": "service",
    "name": "Service",
    "schema": [
      {
        "id": "1",
        "kind": "section",
        "name": "General Information",
        "items": [
          {
            "id": "1775120577200",
            "kind": "field",
            "type": "text",
            "label": "Service Name",
            "properties": {
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120594060",
            "kind": "field",
            "type": "sku",
            "label": "SKU",
            "properties": {
              "prefix": "SERV",
              "editable": true,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120616150",
            "kind": "field",
            "type": "addable-select",
            "label": "Billing Type",
            "options": [
              "Fixed Rate",
              "Hourly Rate",
              "Daily Rate"
            ],
            "properties": {
              "required": true,
              "addButtonTitle": "Add Billing Type"
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120714619",
            "kind": "field",
            "type": "number",
            "label": "Service Rate",
            "properties": {
              "min": 0,
              "required": true
            },
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775120742746",
            "kind": "field",
            "type": "textarea",
            "label": "Description",
            "locked": true,
            "disabledProperties": ["required", "type", "logic"]
          },
          {
            "id": "1775280310136",
            "kind": "field",
            "type": "image",
            "label": "Image",
            "locked": true,
            "disabledProperties": ["required", "type"]
          }
        ],
        "isRepeatable": false
      }
    ],
    "design": {
      "theme": "light",
      "styles": {
        "padding": "md",
        "fontFamily": "plus-jakarta",
        "borderRadius": "lg",
        "primaryColor": "#6366f1"
      },
      "mapping": {},
      "templateId": "simple",
      "visibility": {},
      "cardMapping": {
        "image": "1775280310136",
        "price": "1775120714619",
        "title": "1775120577200"
      },
      "viewMapping": {
        "image": "1775280310136",
        "price": "1775120714619",
        "title": "1775120577200"
      },
      "cardVisibility": {
        "price": true,
        "actions": false,
        "category": false,
        "description": false
      },
      "viewTemplateId": "immersive_flowbite",
      "viewVisibility": {
        "sku": false,
        "sizes": false,
        "colors": false,
        "rating": false,
        "actions": false,
        "highlights": false,
        "description": false,
        "reviewCount": false,
        "variantsSection": false
      }
    },
    "formKey": "service"
  }
];
