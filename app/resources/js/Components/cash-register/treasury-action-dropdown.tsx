import { ChevronDown } from 'lucide-react'
import { type TreasuryAction } from '@/config/treasury-actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TreasuryActionDropdownProps {
  title: string;
  actions: TreasuryAction[];
  onActionClick: (action: TreasuryAction) => void;
  disabled?: boolean;
  variant?: 'default' | 'income' | 'expense';
}

export default function TreasuryActionDropdown({
  title,
  actions,
  onActionClick,
  disabled = false,
  variant = 'default'
}: TreasuryActionDropdownProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'income':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'expense':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${getButtonStyles()}`}
          disabled={disabled}
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          {title}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              onClick={() => onActionClick(action)}
              className="flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-accent"
            >
              <div className="flex items-center gap-2 w-full">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{action.label}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {action.description}
              </p>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}