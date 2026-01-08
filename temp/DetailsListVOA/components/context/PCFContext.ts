import { createContext } from "react";
import { IInputs } from "../../generated/ManifestTypes";

export const PCFContext = createContext<ComponentFramework.Context<IInputs> | null> (null);