---
title: "Notes on DeepWeightFlow"
description: "Informal notes on motivation, surprises, and how weight-space generative models fit into the broader landscape."
pubDate: 2026-03-29
draft: false
---
## Welcome 

It just so happens that as I am finishing my personal webpage, I am also finalizing my arrangements to attend [ICLR 2026](https://iclr.cc/) in Rio de Janeiro. So, I think there's no better candidate for an inaugural blog post than the reason I will be attending — our work on [DeepWeightFlow](https://openreview.net/forum?id=fOwsr1VTi8). It was a tremendous privilege to work with Saumya Gupta, Moritz Laber, Zohair Shafi, Robin Walters, and Ayan Paul on this project. 

![ICLR Logo](/blog/deepweightflow/ICLR-logo.png)

It's too cool of a logo not to include at least once!  

## Introduction

DeepWeightFlow (DWF) is a generative model for neural network weights, often called weight space. These have been built before, but DWF is distinct in some interesting ways: first among them, DWF treats the permutation symmetries of weights as a data augmentation step, rather than as the responsibility of the model architecture. Additional features of note include the extension to transformer and language models as well as linear compression of weights beyond $O(10M)$ and up to $O(100M)$. 

![DWF System Schematic](/blog/deepweightflow/dwf_system.png)


The initial research direction we tried was actually to use symmetry preserving neural network layers in our generative model, in a traditional latent diffusion design. This would have sidestepped any data preprocessing steps. However, we found that these methods struggled with representation collapse in the decoding phase. After publication, we had an interesting chat with one of the authors of these symmetry preserving neural layers regarding our struggles to successfully implement them in this setting, and while they thought there was a way to dodge this collapse, I was not convinced. 

## Treatment of Symmetries

DWF follows in the rich field of Geometric Deep Learning - where the central insight is to formulate rules your data's substrate follow and then account for these in your system. This can be done in a few ways: as mentioned, by baking them into the model architecture directly, or by synthetically expanding your dataset to cover more cases to help your model learn these rules on its own, and finally to just undo the rules to reach an easier problem. This last option is canonicalization - in our case, it means choosing an arbitrary 'correct' permutation of weights, and moving all the other ones as close to that as we can. 

The introduction of canonicalization through [Git Re-Basin](https://openreview.net/forum?id=CQsmMYmlP5T) or [Transfusion](https://openreview.net/forum?id=sHvImzN9pL) was to allow us to use standard MLPs in our system. Without these steps, you have a representation collapse as $Encoder(\theta_A)$ and $Encoder(P\theta_A)$ map to the same latent $z$, but $Decoder(z)$ can only be one, even though they are functionally equivalent. [Ainsworth et al.](https://openreview.net/forum?id=CQsmMYmlP5T) have a great figure (below) that shows how Git Re-Basin can lessen the impact of this discrepancy by finding some $\tilde{P}$ maximizing $\theta_A \cdot \tilde{P}\theta_B$. We also experimented with symmetric loss functions, without success. 

![Git Re-Basin visualization [Ainsworth et al.]](/blog/deepweightflow/git_rebasin.png)


Transfusion was a very late addition to the project, within two or three weeks of the submission deadline. It was extremely recent at the time, and to the best of my knowledge DWF is one of the first applications of the method (perhaps the first, but it's hard to say for sure). Essentially, it extends the canonicalization process of Git Re-Basin to transformer models, including those with multihead attention. Initially we only applied it to ViTs, the canonical example used by [Rinaldi et al.](https://openreview.net/forum?id=sHvImzN9pL). The extension to BERT was an addition in the peer review phase. We chose BERT instead of GPT2 because BERT has the same transformer encoder architecture as ViTs, so the code could be reapplied with minimal changes. I see no reason why GPT2 wouldn't work, but it would require deeper meddling with the Transfusion algorithm. 

These canonicalization algorithms are expensive at scale. Both represent coarse approximations of NP-Hard calculations, with very poor scaling properties. This also means that outside limiting cases, we can't make any claims about having found an 'optimal' solution. While Git Re-Basin is costly, Transfusion is much much more so. To the point that more time was spent canonicalizing large models than actually training DWF on them! 

An interesting architectural note here is to point out the DWF core has linear in/out projections, but the input projection is immediately followed by a LayerNorm step. This actually forces the representation at that point to be permutation invariant, giving the remainder of the model access to a representation which (partially) resolves the collapse discussed earlier. I suspect that this is why the impacts of canonicalization fade as model capacity grows, because for small models with canonicalization, the input projection (~50% of weights) can actually learn structure, whereas without that insurance the model is operating off of the representation after LayerNorm and effectively wasting ~50% of its capacity. I actually designed an experiment to study if this was true, but it ended up on the cutting room floor. This is a coarse understanding, but it communicates the intuition my coauthors and I had. 

## Data Compression

Prior work on weight space generative models notes this limitation, and it's pretty clear why: modern neural networks, especially language models, can be *huge*. As such, operating in the full rank weight space isn't possible at scale. We observed this with DWF, where almost *all* of the Flow Matching core's parameters were dedicated to the input and output projection steps - to the tune of 99% or more!  

Other work in this subfield addresses this in a few ways: 

* Do subset generation (batchnorms, decision heads, etc)
* Autoregressive sampling for generation
* Variational Autoencoding

Variational Autoencoding seems particularly popular, likely because it is very responsive to CLIP-style conditioning. Other authors used this as a vehicle to investigate the possibility of embedding dataset samples to guide weight generation, with the hopes of having superior transfer learning performance. 

In contrast, we used no compression up to O(10M) parameter networks. To scale, we transitioned to using Dual/Gram PCA compression to continue scaling to O(100M) - although I do not think we pressed the upper bounds of this method's compression abilities. Notably, this is a linear compression method, but does not require the complete storage of huge matrices. I recall investigating an alternative and having several GB of matrices sitting around for a while. 

Reviewers were rightly suspicious of this approach, as linear compression is generally quite sensitive to noise. Initially, we were concerned too. I actually spent a weekend implementing a robust kernel PCA method as backup, but we did not end up needing it ([here](https://github.com/ScottBiggs2/Robust-Kernel-PCA)). At the end of the day, DWF's results of Dual/Gram PCA compression up to GPT2/BERT scale speak for themselves. 

## Training Memorization

I have a personal gripe with this one - it seems like a perfectly reasonable question to ask, right? 

*Is your model just memorizing training data?*

And yeah, in language contexts it does make sense to ask. But wouldn't we praise an image model for generating a great corgi regardless of how close a match to a training point it is? Or a human artist for faithfully reproducing the Mona Lisa? 

The difference here is, I think, largely aesthetic. We can recognize and distinguish human or AI generated text, but AI generated images and videos are increasingly nearly indistinguishable from authentic ones. Therefore, we react more strongly to AI image reproductions than to text reproductions, as they *feel* like a direct undermining of reality or the creative process. A point worth adding here is that, automatic or lifeless text is not new to AI, while it is for images (at least at scale). Anyways...

In image settings - the closest analogy to DWF - this question starts breaking down. At the level of abstraction DWF operates at, I find it extremely shaky. 

In an effort to be thorough, we compared with several methods, including the predictive properties of the generative weights as well as typical measures like L2, KL, and Cosine distances. By these metrics, we found DWF does not memorize. Further, the closest setting to 'out of distribution' for DWF is transfer learning, where we found DWF to be shockingly effective despite lacking the intelligent conditioning deployed by other work in the space. We'll talk about that next. 


## Transfer Learning

Surprisingly, we found that DWF outperforms data conditioned methods in transfer learning *without* dataset embeddings as conditioning, as well as competing in raw generation quality. In fact, the only consistent competitors with DWF in transfer learning settings were fresh initializations and direct pretrained transfers. 

I personally suspect that this may be due to a neural plasticity factor. Our analysis shows that the weights generated by DWF are slightly noisier than those from trained models. This may translate to smoother gradients in transfer learning environments. However, this is speculation, and does not clearly explain why DWF outperforms data conditioned systems. Notably, we did not experiment with conditioning DWF with dataset/sample embeddings or with using DWF models with several output classes in transfer learning. These would be interesting followup experiments for students looking for course projects or a future blog post, but are probably not publication worthy. 

## Applications and What's Next

While generative models of weights are today primarily theoretical objects of interest, there is ongoing and exciting work in generating LoRA adapters or even task specific subnetworks (or Lottery Tickets) in LLMs, where these systems could be applied in the near future (for example, [Sakana AI's Doc-to-LoRA](https://pub.sakana.ai/doc-to-lora/)). These could enable on-the-fly model augmentation based on small text samples or task descriptions. In my view, the primary barriers to these applications are generation scale and speed - fields where DWF is clearly dominant. 

Applying DWF to LoRA generation or other more exotic weight generative tasks is a natural next step. I think this includes deeper investigations of multiclass generative performance, as well as data embedding ablations. 

I'm not sure how to translate the symmetry treatment through canonicalization to this setting, or if it needs to be done at all. In fact, I'd guess that the primary challenge to many of these projects is dataset collection and management. However, I also have no doubt that there are already other groups working in these directions - because one of the first papers to cite DWF is in the field! Best of luck guys!

## Conclusion

*DeepWeightFlow* was a strong introduction to research as a discipline, and I had a great time working with my brilliant coauthors, as well as the other great staff and co-ops at the [EAI Neural Dynamics Lab](https://neuraldynamics.lab.ai.northeastern.edu/). 

It's a terrible pity that I will likely be the only representative able to make it to the conference in person, but I look forward to making friends and connections in an increasingly global research community. If you're attending, reach out! 
