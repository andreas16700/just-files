<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {login, loginWithToken, userContainer} from '$lib/stores/stores.svelte'
    import {account, client, triggerSecretGen, PUBLIC_COLL_ID, RECORD_ID} from "$lib/appwrite"
    import { page } from '$app/state';
    import {PublicDocStore} from "$lib/stores/SingleDocStore.svelte"

    
    import { qr as svgQR } from '@svelte-put/qr/svg';
	  import SvgQR from '@svelte-put/qr/svg/QR.svelte';

    import {v4 as uuidv4} from 'uuid';
	  import type { Models } from 'node-appwrite';

    // let uuid = $state(uuidv4())
    let uuid = $state("09c568s-b171-4f4d-a196-9b02dbcf74bf")
    let data = $derived(`${page.url.origin}/?uuid=${uuid}`)
    const img_url = 'https://aw2.aloiz.ch/v1/storage/buckets/public/files/ares/view?project=justfiles&project=justfiles&mode=admin'




    let email = $state('');
    let password = $state('');

    let waiting = $state(false)
    let store = $state(new PublicDocStore(PUBLIC_COLL_ID, RECORD_ID))
    
    let has_update = $derived.by(()=>{
      if (store.doc != null){
        return store.doc.has_update
      }
      return false
    })
    function triggerReload(){
      const origin = page.url.origin
      const new_url = origin+`?req_secret_with_uuid=${uuid}`
      window.location.href = new_url
    }
    onDestroy(()=>{
      store.clear()
      console.log("destroy login compoenent triggered")
    })
    // import { page } from '$app/state';
    $effect(()=>{
      console.log("my uuid is "+uuid)
        if (has_update){
          console.log('update found. triggering reload.')
          triggerReload()
        }
        let s = page.data
        const token: Models.Token = s['secret']
        if (token){
          console.log(token)
          loginWithToken(token)
        }else{
          // console.log("empty")
        }
    })
    /**
     * Selects an update item.
     * @param {MouseEvent | KeyboardEvent | SubmitEvent} event
     */
    async function btnPressed(event: MouseEvent | KeyboardEvent | SubmitEvent){
      // Animation logic (keep as is)
      if (event?.currentTarget && event.currentTarget instanceof HTMLElement) {
            const el = event.currentTarget;
            const class_name = "animate-mypulse";
            el.classList.remove(class_name);
            void el.offsetWidth;
            el.classList.add(class_name);
            setTimeout(() => {
                if (el?.classList.contains(class_name)) {
                     el.classList.remove(class_name);
                }
            }, 450);
        }
      await loginClicked()
    }

    async function loginClicked() {
      if (waiting){return}
      
      waiting=true
      await login(email, password)
      waiting=false
    }

</script>
<div class="min-h-screen flex items-center justify-center
         bg-gray-50 dark:bg-gray-800
         py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold
             text-gray-900 dark:text-gray-100">
          Sign in to your account
        </h2>
      </div>
      <div>
        <SvgQR {data} logo={img_url}/>
      </div>
      <form class="mt-8 space-y-6" onsubmit={(event) => btnPressed(event)}>
        <input type="hidden" name="remember" value="true">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autocomplete="email" required bind:value={email} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 dark:placeholder-gray-400
                   text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400
                   focus:border-indigo-500 dark:focus:border-indigo-400 focus:z-10 sm:text-sm" placeholder="Email address">
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required bind:value={password} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 dark:placeholder-gray-400
                   text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400
                   focus:border-indigo-500 dark:focus:border-indigo-400 focus:z-10 sm:text-sm" placeholder="Password">
          </div>
        </div>
  
        <div>
          <button type="submit" 
          onclick={(event) => btnPressed(event)}
          onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') btnPressed(event)}}
          disabled={waiting}
          class="group relative w-full flex justify-center py-2 px-4
           border border-transparent text-sm font-medium rounded-md text-white
               bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
               focus:outline-none focus:ring-2 focus:ring-offset-2
               focus:ring-indigo-500 dark:focus:ring-indigo-400">
            Sign in
          </button>
        </div>
      </form>
    </div>
  </div>
