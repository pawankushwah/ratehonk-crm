import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { uuidv7 } from "uuidv7";

interface DropdownOptionAttributes {
  id: string;
  value: string;
  label?: string;
  dropdownSetId: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DropdownOptionCreationAttributes extends Optional<DropdownOptionAttributes, "id" | "label" | "order"> {}

class DropdownOption extends Model<DropdownOptionAttributes, DropdownOptionCreationAttributes> implements DropdownOptionAttributes {
  public id!: string;
  public value!: string;
  public label?: string;
  public dropdownSetId!: string;
  public order!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DropdownOption.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv7(),
      allowNull: false,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dropdownSetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "dropdown_sets",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "dropdown_options",
    timestamps: true,
  }
);

export default DropdownOption;
