import type { Template } from '../types/global'

/**
 * Centralized service for managing floating templates window
 * Handles all floating window operations and state synchronization
 */
class FloatingWindowService {
  private isActive: boolean = false
  private listeners: Set<(isActive: boolean) => void> = new Set()

  /**
   * Subscribe to floating window state changes
   */
  subscribe(listener: (isActive: boolean) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.isActive)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isActive))
  }

  /**
   * Check if floating window actually exists in main process
   */
  async isWindowOpen(): Promise<boolean> {
    try {
      if (window.api?.isFloatingTemplatesOpen) {
        const result = await window.api.isFloatingTemplatesOpen()
        return result.isOpen || false
      }
      return false
    } catch (error) {
      console.error('Failed to check floating window status:', error)
      return false
    }
  }

  /**
   * Synchronize internal state with actual window state
   */
  async syncState(): Promise<void> {
    const actuallyOpen = await this.isWindowOpen()
    if (this.isActive !== actuallyOpen) {
      this.isActive = actuallyOpen
      this.notifyListeners()
    }
  }

  /**
   * Create floating templates window
   */
  async createWindow(templates: Template[]): Promise<boolean> {
    try {
      // First check if window already exists
      const alreadyExists = await this.isWindowOpen()
      if (alreadyExists) {
        console.log('Floating window already exists, updating instead')
        return this.updateWindow(templates)
      }

      if (window.api?.createFloatingTemplates) {
        const result = await window.api.createFloatingTemplates(templates)
        if (result.success) {
          this.isActive = true
          this.notifyListeners()
          return true
        } else {
          console.error('Failed to create floating window:', result.error)
          return false
        }
      }
      return false
    } catch (error) {
      console.error('Failed to create floating templates window:', error)
      return false
    }
  }

  /**
   * Update existing floating templates window
   */
  async updateWindow(templates: Template[]): Promise<boolean> {
    try {
      if (window.api?.updateFloatingTemplates) {
        const result = await window.api.updateFloatingTemplates(templates)
        if (result.success) {
          // Ensure state is correct
          if (!this.isActive) {
            this.isActive = true
            this.notifyListeners()
          }
          return true
        } else {
          console.log('Update failed, window may not exist:', result.error)
          // Sync state to reflect reality
          await this.syncState()
          return false
        }
      }
      return false
    } catch (error) {
      console.error('Failed to update floating templates window:', error)
      await this.syncState()
      return false
    }
  }

  /**
   * Close floating templates window
   */
  async closeWindow(): Promise<boolean> {
    try {
      if (window.api?.closeFloatingTemplates) {
        const result = await window.api.closeFloatingTemplates()
        if (result.success) {
          this.isActive = false
          this.notifyListeners()
          return true
        } else {
          console.error('Failed to close floating window:', result.error)
          // Still sync state in case window was closed externally
          await this.syncState()
          return false
        }
      } else {
        // API not available, assume closed
        this.isActive = false
        this.notifyListeners()
        return true
      }
    } catch (error) {
      console.error('Failed to close floating templates window:', error)
      // Sync state to reflect reality
      await this.syncState()
      return false
    }
  }

  /**
   * Manage floating window based on templates and settings
   */
  async manageWindow(templates: Template[], pinTemplatesEnabled: boolean): Promise<void> {
    const pinnedTemplates = templates.filter(t => t.pinned)
    
    console.log('FloatingWindowService.manageWindow called:', {
      pinTemplatesEnabled,
      pinnedTemplatesCount: pinnedTemplates.length,
      totalTemplates: templates.length
    })
    
    if (pinTemplatesEnabled && pinnedTemplates.length > 0) {
      // Should have floating window
      const windowExists = await this.isWindowOpen()
      console.log('Window should exist, currently exists:', windowExists)
      
      if (windowExists) {
        // Update existing window
        console.log('Updating existing floating window')
        await this.updateWindow(pinnedTemplates)
      } else {
        // Create new window
        console.log('Creating new floating window')
        await this.createWindow(pinnedTemplates)
      }
    } else {
      // Should not have floating window
      const windowExists = await this.isWindowOpen()
      console.log('Window should not exist, currently exists:', windowExists)
      
      if (windowExists) {
        console.log('Closing floating window')
        await this.closeWindow()
      } else {
        // Ensure state is correct
        if (this.isActive) {
          console.log('Syncing state - marking as inactive')
          this.isActive = false
          this.notifyListeners()
        }
      }
    }
  }

  /**
   * Get current active state
   */
  getIsActive(): boolean {
    return this.isActive
  }

  /**
   * Force close all floating windows (emergency cleanup)
   */
  async forceCloseAll(): Promise<void> {
    try {
      // Try to close through API
      await this.closeWindow()
      
      // Double-check and sync state
      await this.syncState()
      
      console.log('Force close completed, final state:', this.isActive)
    } catch (error) {
      console.error('Error during force close:', error)
    }
  }
}

// Export singleton instance
export const floatingWindowService = new FloatingWindowService()
export default floatingWindowService