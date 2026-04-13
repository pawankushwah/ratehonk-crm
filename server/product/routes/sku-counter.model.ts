import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface SkuCounterAttributes {
  id: string;
  userId: string;
  prefix: string;
  currentNumber: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SkuCounterCreationAttributes extends Optional<SkuCounterAttributes, "id" | "currentNumber"> {}

class SkuCounter extends Model<SkuCounterAttributes, SkuCounterCreationAttributes> implements SkuCounterAttributes {
  public id!: string;
  public userId!: string;
  public prefix!: string;
  public currentNumber!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SkuCounter.init(
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
    prefix: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "sku_counters",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "prefix"],
      },
    ],
  }
);

export default SkuCounter;
