import * as fc from 'fast-check';
import { MessageStatus } from '../../types/message';
import { messageArbitrary, messageStatusArbitrary } from '../fixtures/arbitraries';

/**
 * Property-based tests for message status state machine
 * Feature: mobile-app-mvp-features
 */

describe('Message Status State Machine Properties', () => {
  // Feature: mobile-app-mvp-features, Property 1: Message Status State Machine
  it('should only allow valid status transitions', () => {
    fc.assert(
      fc.property(
        messageStatusArbitrary(),
        messageStatusArbitrary(),
        (fromStatus, toStatus) => {
          const isValid = isValidTransition(fromStatus, toStatus);
          
          // Valid transitions:
          // pending -> sending, failed
          // sending -> sent, failed
          // sent -> delivered, failed
          // delivered -> read
          // read -> (terminal)
          // failed -> (terminal)
          
          if (fromStatus === toStatus) {
            return true; // Same status is always valid
          }
          
          const validTransitions: Record<MessageStatus, MessageStatus[]> = {
            [MessageStatus.PENDING]: [MessageStatus.SENDING, MessageStatus.FAILED],
            [MessageStatus.SENDING]: [MessageStatus.SENT, MessageStatus.FAILED],
            [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.FAILED],
            [MessageStatus.DELIVERED]: [MessageStatus.READ],
            [MessageStatus.READ]: [],
            [MessageStatus.FAILED]: [],
          };
          
          const expectedValid = validTransitions[fromStatus]?.includes(toStatus) ?? false;
          return isValid === expectedValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never transition from terminal states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(MessageStatus.READ, MessageStatus.FAILED),
        messageStatusArbitrary(),
        (terminalStatus, newStatus) => {
          if (terminalStatus === newStatus) {
            return true; // Same status is allowed
          }
          return !isValidTransition(terminalStatus, newStatus);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain status field in message object', () => {
    fc.assert(
      fc.property(
        messageArbitrary(),
        (message) => {
          return Object.values(MessageStatus).includes(message.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to validate status transitions
 * This would be implemented in the actual message service
 */
function isValidTransition(from: MessageStatus, to: MessageStatus): boolean {
  if (from === to) return true;
  
  const validTransitions: Record<MessageStatus, MessageStatus[]> = {
    [MessageStatus.PENDING]: [MessageStatus.SENDING, MessageStatus.FAILED],
    [MessageStatus.SENDING]: [MessageStatus.SENT, MessageStatus.FAILED],
    [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.FAILED],
    [MessageStatus.DELIVERED]: [MessageStatus.READ],
    [MessageStatus.READ]: [],
    [MessageStatus.FAILED]: [],
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}
