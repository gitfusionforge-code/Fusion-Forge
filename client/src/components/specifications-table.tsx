import { Component } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface SpecificationsTableProps {
  components: Component[];
  totalPrice: string;
  buildName: string;
}

export default function SpecificationsTable({ 
  components, 
  totalPrice, 
  buildName 
}: SpecificationsTableProps) {
  const componentsByType = components.reduce((acc, component) => {
    const type = component.name;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, Component[]>);

  const componentOrder = [
    'Processor',
    'Graphics Card', 
    'Memory',
    'Storage',
    'Motherboard',
    'Power Supply',
    'Case',
    'Cooling'
  ];

  const orderedComponents = componentOrder
    .map(type => componentsByType[type]?.[0])
    .filter(Boolean);

  // Add any remaining components not in the predefined order
  Object.values(componentsByType).forEach(typeComponents => {
    typeComponents.forEach(component => {
      if (!orderedComponents.find(c => c.id === component.id)) {
        orderedComponents.push(component);
      }
    });
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-deep-blue">
          {buildName} - Complete Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="font-semibold text-deep-blue dark:text-white">Component</TableHead>
                <TableHead className="font-semibold text-deep-blue dark:text-white">Specification</TableHead>
                <TableHead className="font-semibold text-deep-blue dark:text-white text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedComponents.map((component) => (
                <TableRow 
                  key={component.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <TableCell className="font-medium text-deep-blue dark:text-white">
                    <Badge variant="outline" className="mr-2">
                      {component.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {component.specification}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-orange-500">
                    {formatPrice(component.price)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                <TableCell className="font-bold text-deep-blue dark:text-white text-lg">
                  Total Build Price
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-xl text-orange-500">
                  {formatPrice(totalPrice)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-deep-blue dark:text-white mb-2">
            What's Included:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Professional assembly and cable management</li>
            <li>• System testing and burn-in for 24 hours</li>
            <li>• Operating system installation and updates</li>
            <li>• Essential driver installation</li>
            <li>• 1-year warranty on complete build</li>
            <li>• Free technical support for 6 months</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}