const generateShiftsForSite = async (siteId, dateRange) => {
  const site = await Site.findById(siteId);
  const { coverageRequirements } = site;

  const shifts = [];
  for (let date = dateRange.start; date <= dateRange.end; date.addDays(1)) {
    if (coverageRequirements.daysOfWeek.includes(date.getDay())) {
      for (const req of coverageRequirements.shiftsPerDay) {
        shifts.push({
          site: siteId,
          date: date.toISOString().split('T')[0],
          shiftType: req.shiftType,
          startTime: req.startTime,
          endTime: req.endTime,
          // Guard assignment remains manual or uses recommendation engine
        });
      }
    }
  }
  return shifts;
};