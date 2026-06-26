import { useEffect, useState } from 'react';
import { ribbonTabs, tabForModule, profileToLevel, type RibbonTab } from '../../ribbon.config';
import { useAuth } from '../../stores/auth';
import classes from './TopRibbon.module.css';

interface TopRibbonProps {
  active: string;           // current module key
  onSelect: (key: string) => void;
}

/**
 * Two-level MS Office-style ribbon.
 *
 * Level 1 — Tab strip (slim, dark): Home | People | Academics | …
 * Level 2 — Action ribbon (light): grouped actions for the selected tab.
 *
 * Active tab is derived from the current module; user can also click a tab
 * to browse its actions without navigating (standard ribbon behaviour).
 */
export function TopRibbon({ active, onSelect }: TopRibbonProps) {
  const user = useAuth((s) => s.user);
  const userLevel = profileToLevel(user?.profile ?? '');
  const [activeTab, setActiveTab] = useState(() => tabForModule(active));

  // Sync tab when external navigation changes `active`
  useEffect(() => {
    const t = tabForModule(active);
    if (t !== 'home' || active === 'dashboard') setActiveTab(t);
  }, [active]);

  // Filter tabs the user can see
  const visibleTabs = ribbonTabs.filter(
    (t) => !t.accessLevel || userLevel <= t.accessLevel,
  );

  const currentTab: RibbonTab =
    visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0];

  return (
    <div className={classes.ribbonRoot} role="navigation" aria-label="Module navigation">
      {/* ── Level 1: Tab strip ── */}
      <div className={classes.tabStrip} role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === activeTab}
            aria-controls={`ribbon-panel-${tab.id}`}
            className={classes.tabBtn}
            data-active={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Level 2: Action ribbon ── */}
      <div
        id={`ribbon-panel-${currentTab?.id}`}
        className={classes.actionRibbon}
        role="tabpanel"
      >
        <div className={classes.actionInner}>
          {currentTab?.groups.map((group, gi) => {
            // Filter actions by user level
            const visibleActions = group.actions.filter(
              (a) => !a.accessLevel || userLevel <= a.accessLevel,
            );
            if (visibleActions.length === 0) return null;

            return (
              <div key={group.id} className={classes.actionGroup}>
                {gi > 0 && <div className={classes.groupDivider} aria-hidden />}
                <div className={classes.actionRow}>
                  {visibleActions.map((action) => {
                    const Icon = action.icon;
                    const isActive = action.key === active && !action.placeholder;
                    return (
                      <button
                        key={action.key}
                        type="button"
                        className={classes.actionBtn}
                        data-active={isActive}
                        data-placeholder={action.placeholder ?? false}
                        disabled={action.placeholder}
                        onClick={() => !action.placeholder && onSelect(action.key)}
                        title={action.placeholder ? `${action.label} — coming soon` : action.label}
                        aria-label={action.label}
                        aria-current={isActive ? 'page' : undefined}
                        aria-disabled={action.placeholder}
                        tabIndex={action.placeholder ? -1 : 0}
                      >
                        <Icon size={20} strokeWidth={1.7} />
                        <span className={classes.actionLabel}>{action.label}</span>
                        {action.badge && (
                          <span className={classes.actionBadge}>{action.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className={classes.groupLabel}>{group.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
