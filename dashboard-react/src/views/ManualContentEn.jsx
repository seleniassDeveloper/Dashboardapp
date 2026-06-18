
import React, { useState } from 'react';

export default function ManualContentEn() {
  const [zoomImg, setZoomImg] = useState(null);

  const handleImageClick = (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.gallery')) {
      setZoomImg(e.target.src);
    }
  };

  return (
    <>
      <div className="manual-wrapper" onClick={handleImageClick}>
        
<div className="manual-layout"><aside className="manual-sidebar"><h3>Interactive index</h3><ul><li><a href="#modulo-1">Module 01: Control Panel</a></li><li><a href="#modulo-2">Module 02: Smart Agenda</a></li><li><a href="#modulo-3">Module 03: Clients</a></li><li><a href="#modulo-4">Module 04: Services Catalog</a></li><li><a href="#modulo-5">Module 05: Work Team and Settlements</a></li><li><a href="#modulo-6">Module 06: Finance and Cash</a></li><li><a href="#modulo-7">Module 07: ERP Inventory</a></li><li><a href="#modulo-8">Module 08: Copilot Aura AI and Automations</a></li><li><a href="#modulo-9">Module 09: Google Sheets Synchronizer</a></li><li><a href="#modulo-10">Module 010: General Configuration and Roles</a></li><li><a href="#modulo-11">Module 011: Marketing and Instagram Content Generator</a></li></ul></aside><div className="manual-main-content"><div className="manual-wrap">

  <div className="manual-cover">
    <span className="manual-badge">Documentation · Organized by modules</span>
    <h1>AuraDash Suite</h1>
    <p>Manual of Screens and Functionalities</p>
  </div>

  <div className="manual-legend">
    <h2>How to read this document</h2>
    <div className="manual-legend-grid">
      <div className="manual-leg"><span className="manual-swatch manual-sw-desc"></span><div><span className="manual-term">Descriptive text</span>— explains what each manual-module or manual-screen is for.</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-info"></span><div><span className="manual-term">Screen Information</span>— what data the user sees (green block).</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-func"></span><div><span className="manual-term">Features / Form</span>— what can be done (amber block).</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-chip"></span><div><span className="manual-btn">Button</span>— clickable actions highlighted as a label.</div></div>
    </div>
  </div>

  {/**/}
  <section className="manual-module" id="modulo-1">
    <header>
      <div className="num">Module 01</div>
      <h2>Control Panel (Dashboard)</h2>
      <div className="desc">Home manual-screen and business monitoring center.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Dashboard Main View</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li><span className="manual-term">Top Search:</span> <span className="manual-descr">search in real time. Hides mismatched gadgets and disables dragging of widgets while search is active.</span></li>
            <li><span className="manual-term">Gadgets KPI:</span> <span className="manual-descr">floating cards with gradients showing:</span>
              <ul>
                <li><span className="manual-term">Total Billing</span>— sum of charges for completed appointments in the range.</li>
                <li><span className="manual-term">Commissions to Pay</span>— accumulated amount for professionals (40%).</li>
                <li><span className="manual-term">Bills</span>— sum of expenses recorded in the month.</li>
                <li><span className="manual-term">Net Profit</span>— billing less commissions and expenses.</li>
                <li><span className="manual-term">Critical Products</span>— inputs below the minimum stock.</li>
              </ul>
            </li>
            <li><span className="manual-term">Billing Chart:</span> <span className="manual-descr">bars (Recharts) that compare sales day by day or month by month.</span></li>
            <li><span className="manual-term">Payment Methods Chart:</span> <span className="manual-descr">donate with the % collected in Cash, Debit, Credit and Transfer.</span></li>
            <li><span className="manual-term">Quick Agenda of the Day:</span> <span className="manual-descr">table with today's appointments (Client, Time, Service, Professional, Payment Status and edition).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Add Gadget</span>opens the widget configuration modal.</li>
            <li><span className="manual-btn">Clear Search</span>visible in "No Results" when no gadgets are found.</li>
            <li><span className="manual-btn">Drag Grip</span>Visually reorder gadgets (only without active search).</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Modal: Gadget Settings<span className="manual-pill">WidgetSettingsModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li>Checkboxes to activate or deactivate each home manual-screen widget.</li>
            <li>Widget size settings (1x1, 2x1, full width).</li>
            <li>Background color selector (classic theme, modern HSL, dark mode).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">Save Design</span>persists the configuration in the user's profile in PostgreSQL.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/panel-panel1.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-panel2.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-qrcitapanel.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-vistadetalledecitapanel.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-informesiapanel.png" alt="Captura de modulo-1" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-2">
    <header>
      <div className="num">Module 02</div>
      <h2>Smart Agenda (Calendar)</h2>
      <div className="desc">Main scheduling and daily appointment control tool.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Agenda Overview</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li><span className="manual-term">Central Calendar (FullCalendar):</span> <span className="manual-descr">Color-coded schedule grid according to the assigned professional.</span></li>
            <li><span className="manual-term">"+ New appointment" button:</span> <span className="manual-descr">Located in the top header, it allows you to quickly schedule shifts by opening the modal with clean fields without having to click on a calendar time cell.</span></li>
            <li><span className="manual-term">Left Side Bar (Gap Finder):</span> <span className="manual-descr">Quick form to find free spaces.</span></li>
            <li><span className="manual-term">Waiting list:</span> <span className="manual-descr">customers signed up for today who are expecting a cancellation.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Sidebar: Waiting List and Gap Finder</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li><span className="manual-term">Gap Finder:</span> <span className="manual-descr">Selectors for Service, Professional and Preferred Hour Range.</span></li>
            <li><span className="manual-term">Waiting list:</span> <span className="manual-descr">cards with Name, Telephone, Requested Service and Desired Time Range.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Search Gaps</span>analyzes the agenda and shows available times; Choosing one opens the pre-filled appointment form.</li>
            <li><span className="manual-btn">Add to Waiting List</span>Opens a miniform to queue a customer.</li>
            <li><span className="manual-btn">Assign Shift</span>converts the hold card to an appointment when a space becomes available.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Modal: Create/Edit Appointment</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li><span className="manual-term">Client Finder:</span> <span className="manual-descr">input with autocompletion; If it does not exist, allow [+ New Client].</span></li>
            <li><span className="manual-term">Services:</span> <span className="manual-descr">Multiple selector with dynamic calculation of duration and price in real time.</span></li>
            <li><span className="manual-term">Collaborator/Stylist:</span> <span className="manual-descr">responsible professional selector.</span></li>
            <li><span className="manual-term">Schedule:</span> <span className="manual-descr">Date, Start Time and End Time (calculated according to the services).</span></li>
            <li><span className="manual-term">Appointment Notes:</span> <span className="manual-descr">free text (e.g. "Allergy to bleach").</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Save Appointment</span>Records the appointment and validates that the professional does not have overlapping shifts.</li>
            <li><span className="manual-btn">Delete/Cancel</span>change the status to "Cancelled" and free up the space.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>D. Modal: End Service and Collection (Checkout Flow)<span className="manual-pill">FinalizeServiceModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li>Appointment summary: Client, Services and Responsible Specialist.</li>
            <li><span className="manual-term">Amount Receivable ($):</span> <span className="manual-descr">actual final price charged to the client (it is initialized with the price of the original service but allows discounts or additions to be applied).</span></li>
            <li><span className="manual-term">Payment Method:</span> <span className="manual-descr">Cash, Mercado Pago, Bank Transfer, Debit Card or Credit Card.</span></li>
            <li><span className="manual-term">Clinical Notes / Evolution:</span> <span className="manual-descr">Mandatory registration of the technical detail of the work performed (e.g. dye tones, posing time, initial state) for the technical history.</span></li>
            <li><span className="manual-term">Post-Care Recommendations:</span> <span className="manual-descr">optional instructions for the client to perform care at home.</span></li>
            <li><span className="manual-term">Evolution Photos (Before & After):</span> <span className="manual-descr">interactive visual upload of two photos (before starting work and after completing it).</span></li>
            <li><span className="manual-term">Sending Digital Receipt:</span> <span className="manual-descr">options to send an invoice in HTML via email (Gmail) and/or open the WhatsApp redirection with a pre-filled message detailing the service, professional, amount and payment method.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">End Shift</span>saves the technical sheet of the service, records the transaction in Finance, settles the commission to the professional, deducts supplies from the stock and changes the status of the appointment to "Completed".</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/agenda-agendavista.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-lista-de-espera.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-detalle-de-ingresos-estimados-del-di-a.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-2026-06-16-7.31.54-pm.png" alt="Captura de modulo-2" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-3">
    <header>
      <div className="num">Module 03</div>
      <h2>Customers (CRM)</h2>
      <div className="desc">Advanced client directory and health/aesthetic files.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Main View of Clients</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li><span className="manual-term">Seeker:</span> <span className="manual-descr">filter by Name, Phone or Email.</span></li>
            <li><span className="manual-term">Customer Grid:</span> <span className="manual-descr">cards with Name, Telephone, last visit, Average Ticket and labels (Active, Inactive, At Risk).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">+ Register Client</span>Open the creation modal.</li>
            <li><span className="manual-btn">Export Excel</span>download the mapped customer base.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Client Detail Panel<span className="manual-pill">ClientDetailModal</span></h3>
        <p className="manual-tabs-note">Unified client file that is displayed when selected. It has the option to capture or upload a profile photo (by clicking on the avatar, which opens the device's webcam or a local file selector). It is divided into 4 tabs:</p>
        <div className="manual-block info">
          <span className="manual-tag">Tab · Profile and Statistics</span>
          <ul><li>Graphs of accumulated spending, average ticket, most contracted services and favorite professional.</li></ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Tab · Technical Data Sheet (Dossier)</span>
          <ul>
            <li>Chemical formulas (e.g. "L'Oreal Tincture 7.1 (45g) + Oxidant 20 vol (60ml)"), polish brands, skin/hair type and medical contraindications.</li>
            <li><span className="manual-btn">Edit File</span>Modify formulas and notes in real time.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Tab · Visit History</span>
          <ul><li>Chronological table: Date, Appointment ID, Services, Professional, Total charged and Payment status.</li></ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Tab · Evolution and Style (Timeline and Gallery)</span>
          <ul>
            <li>Double column side-by-side layout:</li>
            <li><strong>Left Column:</strong>"Visual Evolution Gallery" that renders the "Before" and "After" photos taken at the service checkout side by side, labeled and arranged chronologically with zoom hover effects.</li>
            <li><strong>Right Column:</strong>"Evolution Timeline" detailing clinical notes of technical evolution and care instructions.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/consentimiento-2026-06-16-7.44.00-pm.png" alt="Captura de modulo-3" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-4">
    <header>
      <div className="num">Module 04</div>
      <h2>Services Catalog</h2>
      <div className="desc">Definition of treatments and their link with inputs.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Services View</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Services grouped by categories (Color, Manicure, Treatments, etc.).</li>
            <li>Each row: Name, Duration (min), Sale price, Agenda color and Active branches.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">+ Create Service</span>Open the creation form.</li>
            <li><span className="manual-btn">Edit</span> <span className="manual-btn">Delete</span>available in each row.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Modal: Service Form</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li>Name, Category, Duration, Price and Color fields in the agenda.</li>
            <li><span className="manual-term">Consumption Rules:</span> <span className="manual-descr">add inputs consumed per session (e.g. "Oxidant Cream 20 Vol", quantity "100", unit "ml").</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features</span>
          <ul><li><span className="manual-btn">Keep</span>synchronizes the service and establishes relational consumption rules.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/servicios-2026-06-16-7.32.15-pm.png" alt="Captura de modulo-4" loading="lazy"/><img src="manual-assets/servicios-2026-06-16-7.32.48-pm.png" alt="Captura de modulo-4" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-5">
    <header>
      <div className="num">Module 05</div>
      <h2>Work Team and Settlements</h2>
      <div className="desc">Personnel control, schedules and automated commission calculation.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Staff Main View</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Collaborators with their position, assigned branch and activity status.</li>
            <li><span className="manual-term">Performance Indicators:</span> <span className="manual-descr">retention of new customers and participation in global sales.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Tab: Schedule Management</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li>Table from Monday to Sunday for each professional.</li>
            <li>Fields for Arrival Time, Departure Time and breaks (lunch) per day.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features</span>
          <ul><li><span className="manual-btn">Save Schedule</span>applies limits to the calendar to manual-block out-of-turn scheduling.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Tab: Commission Settlement</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Date range selector (Current Month, Previous Month, custom).</li>
            <li>Professional Selector.</li>
            <li><span className="manual-term">Account Summary:</span>
              <ul>
                <li><span className="manual-term">Total Jobs</span>— value of all shifts attended.</li>
                <li><span className="manual-term">Accumulated Commission</span>— 40% (or the configured %) of the professional.</li>
                <li><span className="manual-term">Payments Made</span>— advances or prior settlements.</li>
                <li><span className="manual-term">Outstanding Balance</span>— difference to be settled.</li>
              </ul>
            </li>
            <li><span className="manual-term">Job Detail:</span> <span className="manual-descr">breakdown by appointment (date, client, services and amount).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">Register Commission Payment</span>pays the balance, creates a financial expense and resets the professional's balance to zero.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/personal-2026-06-16-7.34.13-pm.png" alt="Captura de modulo-5" loading="lazy"/><img src="manual-assets/personal-2026-06-16-7.34.42-pm.png" alt="Captura de modulo-5" loading="lazy"/><img src="manual-assets/personal-2026-06-16-7.37.04-pm.png" alt="Captura de modulo-5" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-6">
    <header>
      <div className="num">Module 06</div>
      <h2>Finance and Cash</h2>
      <div className="desc">Management of income, expenses and daily cash control.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Tab: Daily Cash<span className="manual-pill">DailyCashClosing</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li><span className="manual-term">Opening Amount:</span> <span className="manual-descr">petty cash with which the day starts.</span></li>
            <li><span className="manual-term">Manual Movement:</span> <span className="manual-descr">direct inputs (e.g. change) or outputs (e.g. coffee) from the physical box.</span></li>
            <li><span className="manual-term">Tonnage / Closing:</span> <span className="manual-descr">real physical cash counted at the end of the day.</span></li>
            <li><span className="manual-term">System Balance:</span> <span className="manual-descr">automatic addition of payments in Cash, Card and Transfer.</span></li>
            <li><span className="manual-term">Cash Difference:</span> <span className="manual-descr">discrepancy between what was counted and what was recorded.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Open Box</span>records time and amount of start of operations.</li>
            <li><span className="manual-btn">Register Movement</span>adds or subtracts cash from petty cash.</li>
            <li><span className="manual-btn">Close Box</span>blocks the day's edition, calculates differences and enters the report in the journal.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Tab: Expense History</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul><li>Expense table: Concept, Category (Rent, Supplies, Taxes, Salaries), Date, Amount, Payment Method and Status (Paid/Pending).</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">+ Record Expense</span>Open form to add a new expense.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/finanzas-2026-06-16-7.38.39-pm.png" alt="Captura de modulo-6" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-7">
    <header>
      <div className="num">Module 07</div>
      <h2>ERP Inventory</h2>
      <div className="desc">Total control of stock, FIFO batches, replacements and consumption.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Tab: General Summary<span className="manual-pill">InventoryDashboard</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Total stock valuation and % of products near the critical limit.</li>
            <li>Out of stock alerts.</li>
            <li>Logbook with the last 5 movements (entries, exits, adjustments).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">See Complete Log</span>redirects to movement history.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Tab: Stock Catalog<span className="manual-pill">ProductForm</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information on Screen / Technical Sheet</span>
          <ul>
            <li><span className="manual-term">Advanced Tab Structure:</span>
              <ul>
                <li><span className="manual-term">Essential:</span>Name, Category, Unit of Measurement (ml, gr, Liters, units), Internal Location, Description, Color and Custom Icon.</li>
                <li><span className="manual-term">Stock & Lots:</span>Stock control (Current, Minimum and Ideal Stock) and switches to activate Expiration control and Lot/Batch tracking in income.</li>
                <li><span className="manual-term">Finance:</span>Purchase Cost, Suggested Sales Price and VAT or applicable taxes.</li>
                <li><span className="manual-term">Logistics & Packaging:</span>Unique SKU code, Supplier SKU, Associated Supplier, Estimated replenishment days (Lead Time), Physical weight, Exact volume, Container dimensions (Length/Width/Height) and Bar/QR code.</li>
              </ul>
            </li>
            <li><span className="manual-term">Badges on Board/Cards:</span>Immediate visual identification if the product requires<i>"Lot Control"</i>, <i>"Expiration Control"</i>or if you have<i>"Critical Stock"</i>.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">+ New Product</span>Opens the tabulated advanced technical sheet for the full load.</li>
            <li><span className="manual-btn">+/-</span>quick buttons to adjust stock without opening the full form.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Tab: Batch Control (FIFO)<span className="manual-pill">BatchControl</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Active lots organized by expiration date.</li>
            <li>Each card: Lot Code, Product, Initial/Current Quantity, Unit Cost and Days to Expire (traffic light: Green = Safe, Yellow = Expires soon, Red = Expired).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">+ Register New Lot</span>load merchandise (code, cost, quantity, expiration). Increase global stock automatically.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>D. Tab: Stock Replenishment<span className="manual-pill">PurchaseOrders</span> <span className="manual-pill">SupplierCRUD</span></h3>
        <p className="manual-tabs-note">Divided into 2 sub-tabs:</p>
        <div className="manual-block info">
          <span className="manual-tag">Sub-tab · Replenishment Orders</span>
          <ul>
            <li>Purchase orders with statuses: DRAFT, SENT, CONFIRMED, RECEIVED and CANCELED.</li>
            <li><span className="manual-term">Order Form:</span> <span className="manual-descr">Supplier, notes and grid of products, quantities and agreed prices.</span></li>
            <li><span className="manual-btn">Create Order</span>generates the draft.</li>
            <li><span className="manual-btn">Change Status to Received</span>creates the FIFO lots and increases the general stock of the order products.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Sub-tab · Supplier Directory</span>
          <ul>
            <li>Files with Name, Contact, Telephone, Email, Payment Terms (e.g. "Within 30 days") and Average Delivery Days.</li>
            <li><span className="manual-term">Supplier CRUD</span>to add or edit.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>E. Tab: Consumption Rules<span className="manual-pill">ServiceConsumptionRules</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul><li>Grid with the relationship "Service X consumes quantity Y of product Z".</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul><li><span className="manual-btn">Associate Consumption</span>Create/modify a rule (e.g. "Straightening" with "Liquid Keratin (150ml)").</li></ul>
        </div>
      </div>

    </div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-8">
    <header>
      <div className="num">Module 08</div>
      <h2>Copilot Aura AI and Automations</h2>
      <div className="desc">Operational intelligence manual-module and automatic flows.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Aura AI Copilot View</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Sugerencias de la IA basadas en el análisis de datos de PostgreSQL:
              <ul>
                <li><span className="manual-term">Empty Days Forecast</span>— suggests discount campaigns.</li>
                <li><span className="manual-term">Escaped Clients</span>— customers who did not return, with a button to send a personalized coupon.</li>
                <li><span className="manual-term">Stock Break Points</span>— estimates when a product will be out of stock based on the shift rhythm.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Workflow View</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul><li>Active and inactive flows (e.g. "Appointment Confirmation by Email", "Birthday Greetings").</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">+ Create Workflow</span>Opens the visual automation builder.</li>
            <li><span className="manual-btn">View Execution History</span>shows logs of messages sent, time and failures.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Workflow Builder</h3>
        <div className="manual-block func">
          <span className="manual-tag">Configuration Form</span>
          <ul>
            <li><span className="manual-term">Trigger:</span> <span className="manual-descr">Appointment Created, Appointment Cancelled, Payment Received, Customer Birthday, Inactive Customer.</span></li>
            <li><span className="manual-term">Conditions:</span> <span className="manual-descr">filters by Service, Professional or Branch.</span></li>
            <li><span className="manual-term">Action:</span> <span className="manual-descr">Send Email (templates), Send SMS, Notify Stylist or Trigger Webhook.</span></li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/workflow-2026-06-16-7.40.33-pm.png" alt="Captura de modulo-8" loading="lazy"/><img src="manual-assets/workflow-2026-06-16-7.41.42-pm.png" alt="Captura de modulo-8" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-9">
    <header>
      <div className="num">Module 09</div>
      <h2>Google Sheets Synchronizer</h2>
      <div className="desc">Visual tool to import external databases of clients and services.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Configuration and Import Screen</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul><li>Field to paste the URL of the Google Sheets document (or upload a CSV).</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features</span>
          <ul><li><span className="manual-btn">Connect Spreadsheet</span>loads the first rows into memory and opens the mapping screen.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Column Mapping Screen</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li>Dropdowns that list the columns of the imported spreadsheet.</li>
            <li>The user matches fields with columns (ex: "Cellular" in PostgreSQL ↔ "WhatsApp / Phone").</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features</span>
          <ul>
            <li><span className="manual-btn">Simulate Import</span>validates formats (phones, emails) and shows ready and error records (in red).</li>
            <li><span className="manual-btn">Process and Import</span>Bulk saves valid records to Neon Cloud's Postgres database.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/importacion-2026-06-16-7.39.03-pm.png" alt="Captura de modulo-9" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-10">
    <header>
      <div className="num">Module 10</div>
      <h2>General Configuration and Roles (RBAC)</h2>
      <div className="desc">Business identity management and personnel security permissions.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Brand and Branch Configuration</h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Form</span>
          <ul>
            <li><span className="manual-term">Hall Data:</span> <span className="manual-descr">Name, Telephone, Sector and Industry.</span></li>
            <li><span className="manual-term">Visual Customization:</span> <span className="manual-descr">Logo and corporate color palette (used in the public reserve).</span></li>
            <li><span className="manual-term">Reserve Slug:</span> <span className="manual-descr">Public URL (e.g. /booking/salon-aura).</span></li>
            <li><span className="manual-term">Branch List:</span> <span className="manual-descr">CRUD of physical premises with addresses and telephone numbers.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Roles and Permissions Matrix<span className="manual-pill">RolesPermissionsPage</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Tabla de doble entrada (Matriz RBAC):
              <ul>
                <li><span className="manual-term">Rows</span>— more than 70 permissions by area (Agenda, Customers, Finance, Inventory, Configurations, etc.).</li>
                <li><span className="manual-term">Columns</span>— Roles (Owner/Owner, Administrator, Manager, Stylist, Reception, Viewer).</li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Matrix Checkboxes</span>Checks or unchecks individual permissions by role.</li>
            <li><span className="manual-btn">Create Custom Role</span>new role (e.g. "Junior Stylist") with access from scratch.</li>
            <li><span className="manual-btn">Save Security Changes</span>applies permissions hot, impacting active sessions.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Catalog of Custom Fields and Forms<span className="manual-pill">FieldRegistryEditor</span> <span className="manual-pill">FormSchemaEditor</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information/Definition</span>
          <ul>
            <li><span className="manual-term">Global Field Catalog:</span>Defines reusable fields assigned to application entities:<i>Employee/Team, Customer, Appointment/Booking, Service, and Workflows</i>.</li>
            <li><span className="manual-term">Nested Fields (Subfields):</span>Allows you to structure a field with multiple associated subfields (e.g. in an "Address" field, add subfields "Street", "Number", "Floor", "ZIP"). Each subfield has its own type and mandatory validation rule.</li>
            <li><span className="manual-term">Dynamic Forms:</span>Form schemas (such as "Employee Registration") render these fields and their nested subfields by logically grouping them, performing complex input validations in real time.</li>
            <li><span className="manual-term">JSON persistence:</span>The values ​​of the completed subfields are saved nested under the key<span className="code">customFields.[fieldId].[subFieldId]</span>in JSON format in PostgreSQL.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Save Catalog</span>The global list of field and subfield definitions persists in the field catalog.</li>
            <li><span className="manual-btn">Add Subfield</span>within a field allows you to create a nested subfield specifying its type (text, number, selection, etc.) and if it is required.</li>
            <li><span className="manual-btn">Save Form</span>In the schema editor, it applies the order, visibility and validation of the fields/subfields configured for the creation and editing of records.</li>
            <li><span className="manual-btn">Chevron Top/Bottom</span>Visually reorders fields and subfields in the grid and upload form.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/roles-2026-06-16-7.44.14-pm.png" alt="Captura de modulo-10" loading="lazy"/><img src="manual-assets/campos-2026-06-16-7.43.45-pm.png" alt="Captura de modulo-10" loading="lazy"/><img src="manual-assets/integraciones-2026-06-16-7.42.08-pm.png" alt="Captura de modulo-10" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-11">
    <header>
      <div className="num">Module 11</div>
      <h2>Marketing and Instagram Content Generator</h2>
      <div className="desc">Visual post creator and editor for social networks integrated with visual history and powered with AI.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Customer Consent and Authorization<span className="manual-pill">ClientModal</span> <span className="manual-pill">ClientDetailModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Information / Privacy</span>
          <ul>
            <li><span className="manual-term">Consent Control:</span>Yes/No radio option in customer registration/editing that enables the use of your image for advertising purposes.</li>
            <li><span className="manual-term">Warning Banners:</span>In the customer's visual history, if they do not have active consent, an alert notice is displayed and Instagram posting options are disabled.</li>
            <li><span className="manual-term">Visual History Flags:</span> Tres checkboxes por cada fotografía cargada en el checkout:
              <ul>
                <li><span className="manual-term">Use for Instagram:</span>Enable photo for post builder (requires active marketing consent).</li>
                <li><span className="manual-term">Show in Portfolio:</span>Enable the photo to be shown in the public reserve.</li>
                <li><span className="manual-term">Highlight Work:</span>Highlight the result of the service as a priority.</li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Create content for Instagram</span>In the visual history it collects the selected authorized photos and redirects to the generator with the pre-loaded images.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Visual Creation and Editing Wizard<span className="manual-pill">MarketingView</span></h3>
        <p className="manual-tabs-note">4-Stage Step-by-Step Post Design Wizard:</p>
        <div className="manual-block info">
          <span className="manual-tag">Step 1 · Organization and Selection</span>
          <ul>
            <li>Layout modes: Single Image, Before and After (dual layout), Multi Image Carousel and Free Carousel.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Step 2 · Format and Aspect Ratio</span>
          <ul>
            <li>Formats optimized for social networks: Instagram Post (1:1), Story (9:16) and Reel Cover. Map the canvas with the correct ratios.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Step 3 · Customization and Visual Tools</span>
          <ul>
            <li>Interactive overlay of salon logo, business name, custom watermarks and free text with selectable alignment (top, middle, bottom) and fonts (classic, modern, handwritten).</li>
            <li>Live Editing: Rotate individual images and drag/rearrange buttons.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Step 4 · Copilot AI - Copy Generation</span>
          <ul>
            <li>Smart call to AI model to write attractive captions. Selection of item, service, tone (professional, fun, friendly, promotional) and desired call to action (CTA).</li>
            <li>Autonomously write the text of the post, incorporating suggested hashtags and information about the service performed.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Features / Buttons</span>
          <ul>
            <li><span className="manual-btn">Generate Copy with AI</span>runs the engine to write the post intelligently.</li>
            <li><span className="manual-btn">Download ZIP</span>packages all carousel images into a single compressed file on the client using JSZip.</li>
            <li><span className="manual-btn">Copy Post</span>Copy the drafted text and hashtags with one click to the clipboard.</li>
            <li><span className="manual-btn">Save Post</span>The design persists in the PostgreSQL database as Draft, Ready or Scheduled.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Library and Publications Status</h3>
        <div className="manual-block info">
          <span className="manual-tag">Screen Information</span>
          <ul>
            <li>Pestañas organizativas de contenidos:
              <ul>
                <li><span className="manual-term">Generated/Summary:</span>Authorized photos ready to use and newly designed button.</li>
                <li><span className="manual-term">Scheduled:</span>Calendar and list of posts with scheduled date and time.</li>
                <li><span className="manual-term">Drafts:</span>Designs saved half finished.</li>
                <li><span className="manual-term">Published:</span>History of already shared content.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </section>

</div>
</div></div>


      </div>

      {zoomImg && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}
          onClick={() => setZoomImg(null)}
        >
          <img src={zoomImg} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} alt="Zoomed" />
        </div>
      )}
    </>
  );
}
