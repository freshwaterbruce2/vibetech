
import { ReactNode } from "react";

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: {
    type: any;
    props: {
      className: string;
    }
  };
  features: string[];
}
