import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db.js";
import { uuidv7 } from "uuidv7";

interface DropdownSetAttributes {
  id: string;
  name: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DropdownSetCreationAttributes extends Optional<DropdownSetAttributes, "id"> {}

class DropdownSet extends Model<DropdownSetAttributes, DropdownSetCreationAttributes> implements DropdownSetAttributes {
  public id!: string;
  public name!: string;
  public userId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DropdownSet.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "dropdown_sets",
    timestamps: true,
  }
);

export default DropdownSet;
