import { Spotlight, type SpotlightActionData } from '@mantine/spotlight';
import { Search } from 'lucide-react';
import { modules } from '../../modules';

/** Ctrl-K command palette: jump to any module. */
export function CommandPalette({ onNavigate }: { onNavigate: (key: string) => void }) {
  const actions: SpotlightActionData[] = modules.map((m) => {
    const Icon = m.icon;
    return {
      id: `nav-${m.key}`,
      label: m.label,
      description: `Go to ${m.label}`,
      onClick: () => onNavigate(m.key),
      leftSection: <Icon size={18} strokeWidth={1.8} />,
    };
  });

  return (
    <Spotlight
      actions={actions}
      shortcut="mod + K"
      nothingFound="Nothing found…"
      highlightQuery
      searchProps={{
        leftSection: <Search size={18} strokeWidth={1.8} />,
        placeholder: 'Search modules and actions…',
      }}
    />
  );
}
