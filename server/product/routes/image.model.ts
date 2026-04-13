import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface ImageAttributes {
  id: string;
  data: string; // Base64
  original_data?: string; // Base64 Original Full Version
  name: string;
  mime_type: string;
  createdAt?: Date;
}

interface ImageCreationAttributes extends Optional<ImageAttributes, "id"> {}

class Image extends Model<ImageAttributes, ImageCreationAttributes> implements ImageAttributes {
  public id!: string;
  public data!: string;
  public original_data!: string;
  public name!: string;
  public mime_type!: string;
  public readonly createdAt!: Date;
}

Image.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    original_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "images",
    timestamps: true,
    updatedAt: false,
  }
);

export default Image;
