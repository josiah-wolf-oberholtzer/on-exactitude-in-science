import { createMiddleware } from 'redux-beacon';
import GoogleAnalytics, { trackEvent, trackPageView } from '@redux-beacon/google-analytics';
import logger from '@redux-beacon/logger';
import { LOCATION_CHANGE } from 'connected-react-router';

const ga = GoogleAnalytics(),
  pageView = trackPageView((action) => ({
    page: action.payload.location.pathname,
  })),
  selectEvent = trackEvent((action) => ({
    category: 'interaction', action: 'selected', label: action.payload.label, value: action.payload.eid,
  })),
  deselectEvent = trackEvent((action) => ({
    category: 'interaction', action: 'deselected',
  })),
  eventsMap = {
    [LOCATION_CHANGE]: pageView,
    'graph/selectEntity': selectEvent,
    'graph/deselectEntity': deselectEvent,
  },
  gaMiddleware = createMiddleware(eventsMap, ga, { logger });

export { gaMiddleware };
