// Printify Product
export interface PrintifyProduct {
  id: string;
  title: string;
  description?: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: PrintifyVariant[];
  images?: {
    src: string;
    variant_ids?: number[];
    position?: string;
    is_default?: boolean;
  }[];
}

// Printify Variant
export interface PrintifyVariant {
  id: number;
  price: number;
  sku: string;
  options?: Record<string, string | number | boolean | undefined>;
}

// Printify Image Placeholder
export interface PrintifyImagePlaceholder {
  position: string;
  height: number;
  width: number;
}

// Printify Shipping Address
export interface PrintifyShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  zip: string;
  country: string;
}

// Printify Order Creation Payload
export interface PrintifyOrderCreationPayload {
  external_id?: string;
  address_to: PrintifyShippingAddress;
  line_items: PrintifyLineItemCreation[];
  shipping_method?: number;
}

// Printify Line Item Creation
export interface PrintifyLineItemCreation {
  product_id?: string;
  variant_id: number;
  blueprint_id?: number;
  print_provider_id?: number;
  print_areas?: {
    position: string;
    images: {
      id: string;
      x: number;
      y: number;
      scale: number;
      angle: number;
      // pattern, font_family, etc. podem ser adicionados se fores usar
    }[];
  }[];
  quantity?: number;
} 