                      <p className="text-sm font-medium">
                        {order.plate} — {order.vehicleType}
                      </p>
                      <p className="text-xs">
                        {order.services.join(', ') || 'No services'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b">
              <h2 className="font-semibold">Active Workers</h2>
            </div>

            {workers.filter(w => w.status === 'active').length === 0 ? (
              <div className="p-8 text-center text-sm">
                No active workers.
              </div>
            ) : (
              <div className="divide-y">
                {workers.filter(w => w.status === 'active').map(worker => (
                  <div key={worker.id} className="px-5 py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">{worker.name}</p>
                      <p className="text-xs">{worker.phone}</p>
                    </div>
                    <span className="text-xs">{worker.jobsToday} jobs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceBreakdown />
    </div>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('#work-orders');
  const { getTodayRevenue } = useAppData();
  const { profile } = useUserProfile();
  const role = profile?.role;

  const { title, subtitle } = sectionTitles[activeSection];
  const todayRevenue = getTodayRevenue();

  const renderContent = () => {
    switch (activeSection) {
      case '#dashboard':
        return <DashboardContent />;
      case '#work-orders':
        return role === 'worker' ? <MyWorkerJobs /> : <WorkOrdersManager />;
      case '#customer-orders':
        return <CustomerOrdersManager />;
      case '#workers':
        return <WorkersManager />;
      case '#attendance':
        return <AttendanceManager />;
      case '#commissions':
        return <CommissionsManager />;
      case '#accounting':
        return <DailyAccounting />;
      case '#reports':
        return <ReportsExport />;
      case '#pricing':
        return <PricingManager />;
      case '#utilities':
        return <UtilityTracker />;
      case '#analytics':
        return (
          <>
            <UtilitySummaryCards />
            <RevenueChart />
            <ServiceBreakdown />
          </>
        );
      case '#expenditures':
        return <ExpenditureManager />;
      default:
        return <div>Coming soon</div>;
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'cashier', 'worker']}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          todayRevenue={`GH₵ ${todayRevenue.toFixed(2)}`}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          activeSection={activeSection}
          onNavClick={(href) => {
            setActiveSection(href as Section);
            setMobileOpen(false);
          }}
        />

        <div className="flex-1 flex flex-col">
          <TopHeader onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm mb-4">{subtitle}</p>

            {renderContent()}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
