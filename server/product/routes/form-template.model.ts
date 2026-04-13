import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface FormTemplateAttributes {
  id: string;
  name: string;
  schema: any; // JSONB: stores Sections, Groups, Fields, Logic
  design?: any; // JSONB: stores Studio Pro multi-page layout
  userId: string;
  mappedTo: string; // Foreign key to FrontendForm
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormTemplateCreationAttributes extends Optional<FormTemplateAttributes, "id"> {}

class FormTemplate extends Model<FormTemplateAttributes, FormTemplateCreationAttributes> implements FormTemplateAttributes {
  public id!: string;
  public name!: string;
  public schema!: any;
  public design!: any;
  public userId!: string;
  public mappedTo!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FormTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schema: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    design: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    mappedTo: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "frontend_forms",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "form_templates",
    timestamps: true,
  }
);

export default FormTemplate;
