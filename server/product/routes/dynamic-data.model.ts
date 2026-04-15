import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db.js";
import { uuidv7 } from "uuidv7";

interface DynamicDataAttributes {
  id: string;
  template_id: string;
  owner_id: string; // Resource ID (e.g. product id)
  user_id?: string; // Explicit Owner (User UUID)
  data: any; // JSONB
  createdAt?: Date;
  updatedAt?: Date;
}

interface DynamicDataCreationAttributes extends Optional<DynamicDataAttributes, "id"> {}

class DynamicData extends Model<DynamicDataAttributes, DynamicDataCreationAttributes> implements DynamicDataAttributes {
  public id!: string;
  public template_id!: string;
  public owner_id!: string;
  public user_id!: string;
  public data!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DynamicData.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "form_templates",
        key: "id",
      },
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, // Set to true to avoid breaking existing data, though we should backfill
      references: {
        model: "users",
        key: "id",
      },
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "dynamic_data",
    timestamps: true,
  }
);

export default DynamicData;
