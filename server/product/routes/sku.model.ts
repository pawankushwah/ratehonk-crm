import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface SkuAttributes {
  id: string;
  userId: string;
  sku: string;
  prefix: string;
  number: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SkuCreationAttributes extends Optional<SkuAttributes, "id"> {}

class Sku extends Model<SkuAttributes, SkuCreationAttributes> implements SkuAttributes {
  public id!: string;
  public userId!: string;
  public sku!: string;
  public prefix!: string;
  public number!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sku.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "skus",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "sku"],
      },
    ],
  }
);

export default Sku;
