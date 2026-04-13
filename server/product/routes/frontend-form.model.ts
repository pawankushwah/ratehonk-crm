import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface FrontendFormAttributes {
  id: string;
  name: string;
  formKey: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FrontendFormCreationAttributes extends Optional<FrontendFormAttributes, "id"> {}

class FrontendForm extends Model<FrontendFormAttributes, FrontendFormCreationAttributes> implements FrontendFormAttributes {
  public id!: string;
  public name!: string;
  public formKey!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FrontendForm.init(
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
    formKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "frontend_forms",
    timestamps: true,
  }
);

export default FrontendForm;
