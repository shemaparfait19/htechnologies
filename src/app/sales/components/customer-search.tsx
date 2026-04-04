'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Plus, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerSearchProps {
  onSelectCustomer: (customer: any) => void;
  selectedCustomer: any;
}

export function CustomerSearch({ onSelectCustomer, selectedCustomer }: CustomerSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery) ||
          (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCustomers([]);
      setShowDropdown(false);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    onSelectCustomer(customer);
    setSearchQuery(customer.name);
    setShowDropdown(false);
  };

  const handleCreateNew = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter customer name',
        description: 'Please enter a name for the new customer',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingNew(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchQuery,
          phone: 'N/A', // Will be updated later if needed
          customerType: 'walk_in',
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers([...customers, newCustomer]);
        handleSelectCustomer(newCustomer);
        toast({
          title: 'Customer created',
          description: `${newCustomer.name} has been added`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleClearCustomer = () => {
    onSelectCustomer(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <Label htmlFor="customer-search">Customer (Optional)</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="customer-search"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className="pl-10"
            disabled={selectedCustomer !== null}
          />
          
          {/* Dropdown */}
          {showDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results - create new option */}
          {showDropdown && searchQuery && filteredCustomers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <div
                className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center gap-2"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4" />
                <span>Create new customer: <strong>{searchQuery}</strong></span>
              </div>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <Button variant="outline" onClick={handleClearCustomer}>
            Clear
          </Button>
        )}
      </div>

      {selectedCustomer && (
        <div className="p-3 bg-accent rounded-md">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
