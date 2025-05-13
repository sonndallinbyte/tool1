<script lang="ts" setup>
import {
  ElDialog,
  ElButton,
  ElMessageBox,
  ElInput,
  ElTable,
  ElTableColumn,
  ElMessage,
} from "element-plus";
import { ref, watch } from "vue";
import axios from "axios";

// Define props
const props = defineProps<{
  visible: boolean;
  title?: string;
  width?: string | number;
}>();

// Define emits
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm"): void;
}>();

// Reactive state for domain management
const newDomain = ref("");
const domains = ref<Array<{ id: number; domain: string }>>([]);
const editingIndex = ref<number | null>(null);
const isLoading = ref(false);

// API endpoints
const API_URL_LIST = "https://screenshot.lattex.dev/api/scan-image-links/list-domain";
const API_URL_CREATE = "https://screenshot.lattex.dev/api/scan-image-links/create-domain";
const API_URL_UPDATE = "https://screenshot.lattex.dev/api/scan-image-links/update-domain";
const API_URL_DELETE = "https://screenshot.lattex.dev/api/scan-image-links/delete-domain";

// Fetch domains from API
const fetchDomains = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(API_URL_LIST);
    if (response.data.status === 200) {
      domains.value = response.data.data.map((item: any) => ({
        id: item.id,
        domain: item.domain
      }));
    } else {
      ElMessage.error("Failed to load domains");
    }
  } catch (error) {
    ElMessage.error("Error fetching domains: " + error);
  } finally {
    isLoading.value = false;
  }
};

// Watch for dialog visibility to fetch domains when dialog opens
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      fetchDomains();
    }
  },
  { immediate: true }
);

// Validate domain format (basic validation)
const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
  return domainRegex.test(domain.trim());
};

// Create domain via API
const createDomain = async (domain: string) => {
  isLoading.value = true;
  try {
    const response = await axios.post(API_URL_CREATE, { domain });
    if (response.data.status === 200) {
      ElMessage.success("Domain created successfully");
      // Add the new domain to the list with its ID
      domains.value.push({
        id: response.data.data.id,
        domain: response.data.data.domain
      });
      return true;
    } else {
      ElMessage.error(response.data.message || "Failed to create domain");
      return false;
    }
  } catch (error: any) {
    ElMessage.error("Error creating domain: " + (error.response?.data?.message || error.message));
    return false;
  } finally {
    isLoading.value = false;
  }
};

// Update domain via API
const updateDomain = async (domainId: number, newDomainName: string) => {
  isLoading.value = true;
  try {
    const response = await axios.put(`${API_URL_UPDATE}/${domainId}`, { domain: newDomainName });
    if (response.data.status === 200) {
      ElMessage.success("Domain updated successfully");
      return true;
    } else {
      ElMessage.error(response.data.message || "Failed to update domain");
      return false;
    }
  } catch (error: any) {
    ElMessage.error("Error updating domain: " + (error.response?.data?.message || error.message));
    return false;
  } finally {
    isLoading.value = false;
  }
};

// Delete domain via API
const deleteDomain = async (domainId: number) => {
  isLoading.value = true;
  try {
    const response = await axios.delete(`${API_URL_DELETE}/${domainId}`);
    if (response.data.status === 200) {
      ElMessage.success("Domain deleted successfully");
      return true;
    } else {
      ElMessage.error(response.data.message || "Failed to delete domain");
      return false;
    }
  } catch (error: any) {
    ElMessage.error("Error deleting domain: " + (error.response?.data?.message || error.message));
    return false;
  } finally {
    isLoading.value = false;
  }
};

// Handle adding or updating domain
const handleAddOrUpdateDomain = async () => {
  const domain = newDomain.value.trim();
  if (!domain) {
    ElMessage.error("Please enter a domain");
    return;
  }

  if (!isValidDomain(domain)) {
    ElMessage.error("Please enter a valid domain");
    return;
  }

  if (editingIndex.value !== null) {
    // Update existing domain
    const domainId = domains.value[editingIndex.value].id;
    const success = await updateDomain(domainId, domain);
    
    if (success) {
      // Update the domain in the local array
      domains.value[editingIndex.value].domain = domain;
      // Reset editing state
      editingIndex.value = null;
      newDomain.value = "";
    }
  } else {
    // Add new domain
    if (domains.value.some(d => d.domain === domain)) {
      ElMessage.error("Domain already exists");
      return;
    }
    
    // Call API to create domain
    const success = await createDomain(domain);
    if (success) {
      newDomain.value = "";
    }
  }
};

// Handle editing a domain
const handleEditDomain = (index: number) => {
  editingIndex.value = index;
  newDomain.value = domains.value[index].domain;
};

// Handle deleting a domain
const handleDeleteDomain = (index: number) => {
  const domainToDelete = domains.value[index];
  
  ElMessageBox.confirm(
    `Are you sure you want to delete the domain "${domainToDelete.domain}"?`,
    "Warning",
    {
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      type: "warning",
    }
  )
    .then(async () => {
      const success = await deleteDomain(domainToDelete.id);
      if (success) {
        // Remove domain from the local array
        domains.value.splice(index, 1);
        
        // Reset editing state if deleting the domain being edited
        if (editingIndex.value === index) {
          editingIndex.value = null;
          newDomain.value = "";
        } else if (editingIndex.value !== null && editingIndex.value > index) {
          // Adjust the editing index if we're editing a domain that comes after the deleted one
          editingIndex.value--;
        }
      }
    })
    .catch(() => {
      // User canceled deletion
    });
};


// Handle confirm action
const handleConfirm = () => {
  emit("confirm");
  emit("update:visible", false);
};

// Handle cancel action
const handleCancel = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="props.title || 'Domain Manager'"
    :width="props.width || '1500px'"
    @update:model-value="emit('update:visible', $event)"
    class="rounded-lg shadow-xl"
  >
    <!-- Input and Add/Update Button -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <el-input
        v-model="newDomain"
        placeholder="Enter domain (e.g., example.com)"
        clearable
        class="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        @keyup.enter="handleAddOrUpdateDomain"
      />
      <el-button
        type="primary"
        @click="handleAddOrUpdateDomain"
        :loading="isLoading"
        :disabled="!newDomain.trim() || isLoading"
        class="rounded-md px-6 py-2 text-sm font-semibold"
      >
        {{ editingIndex !== null ? "Update Domain" : "Add Domain" }}
      </el-button>
    </div>

    <!-- Domains Table -->
    <el-table
      :data="domains"
      v-loading="isLoading"
      style="width: 100%"
      class="border border-gray-300 rounded-lg overflow-hidden"
      :header-cell-class-name="'bg-gray-100 text-gray-700 font-semibold border-b border-gray-300 text-left px-4 py-3'"
      :cell-class-name="'border-b border-r border-gray-300 px-4 py-3 last:border-r-0'"
      :row-class-name="'hover:bg-gray-50 transition-colors duration-200'"
    >
      <el-table-column prop="domain" label="Domain" min-width="300" align="left">
        <template #default="{ row }">
          <a
            :href="`http://${row.domain}`"
            target="_blank"
            class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block"
          >
            {{ row.domain }}
          </a>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="200" align="right">
        <template #default="{ $index }">
          <div class="flex gap-2 justify-end">
            <el-button
              type="warning"
              size="small"
              @click="handleEditDomain($index)"
              :disabled="editingIndex !== null && editingIndex !== $index || isLoading"
              class="rounded-md px-4 py-1 text-sm"
            >
              Edit
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteDomain($index)"
              :disabled="isLoading"
              class="rounded-md px-4 py-1 text-sm"
            >
              Delete
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>