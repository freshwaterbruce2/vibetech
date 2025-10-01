
import { ComponentType } from "react";

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: {
    type: ComponentType;
    props: {
      className: string;
    }
  };
  features: string[];
  technologies?: string[];
  realProjects?: string[];
  businessValue?: string;
}
