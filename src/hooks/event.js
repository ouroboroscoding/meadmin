/**
 * Event hook
 *
 * Hook to capture and process events
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-15
 */

// NPM modules
import { useEffect } from 'react';

// Generic modules
import Events from '../generic/events';

// Event Hook
export const useEvent = (name, callback) => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add(name, callback);

		// Return the function to remove the event
		return () => Events.remove(name, callback);
	}, [name, callback]);
}
