<script lang="ts">
  import "../app.css"
  let { children } = $props()
</script>

<div class="bg-base-100 text-base-content h-screen w-screen">
  {@render children()}
</div>
