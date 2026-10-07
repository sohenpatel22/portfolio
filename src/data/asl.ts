import type { Project } from "./projects";

const GH = "https://github.com/sohenpatel22/ASL-Fingerspelling-Recognition";
const blob = (p: string) => `${GH}/blob/main/${p}`;

export const aslFingerspelling: Project = {
  slug: "asl-fingerspelling",
  tier: "major",
  title: "ASL Fingerspelling Recognition",
  kicker: "Deep learning · evaluation · MLOps · live demo",
  summary:
    "Video of ASL fingerspelling in, text out. A Conformer-Transformer reads hand landmarks, scored on signers it never saw, with an error analysis that found where it fails, a confidence rule that flags those cases, a from-scratch retraining that honestly did not win, and the full MLOps loop around it: versioned data, tracked experiments, a gated registry, monitored serving, CI and a free public demo.",
  overview:
    "This began as a course project (MIE1517 at the University of Toronto) with a notebook number I could not trust. I rebuilt it as a tested package and then did the part most portfolio models skip: scored it properly on held-out signers, worked out why it fails, tried six ideas to improve it, reported the ones that did not work, and made the deployed system tell the user when its answer is probably wrong.",
  metric: { value: "0.307", label: "test CER on 14 held-out signers (0.334 for the first deployed checkpoint)" },
  tags: ["Deep Learning", "Evaluation", "MLOps"],
  stack: [
    "PyTorch", "MediaPipe", "Conformer", "CTC", "OpenCV", "FastAPI", "ONNX Runtime", "DVC", "MLflow", "Prometheus",
    "Grafana", "Docker", "GitHub Actions", "Gradio", "Hugging Face Spaces",
  ],
  repo: GH,
  demo: "https://huggingface.co/spaces/SohenP/asl-fingerspelling",
  facts: [
    { k: "0.307", v: "test CER, split by signer (lower is better)" },
    { k: "14", v: "held-out test signers, with per-signer scores" },
    { k: "98.6%", v: "of badly failed clips caught by the confidence flag" },
    { k: "121", v: "automated tests in 15 files, plus a CI metric gate" },
    { k: "177", v: "commits, April to October 2026" },
    { k: "1.6x", v: "faster ONNX inference, identical output" },
  ],
  docs: [
    { label: "README with all results", href: blob("README.md") },
    { label: "Ablation results", href: blob("reports/phase4/results.md") },
    { label: "From-scratch run", href: blob("reports/phase5/results.md") },
    { label: "CI workflow", href: blob(".github/workflows/ci.yml") },
  ],
  sections: [
    {
      title: "The model",
      items: [
        "MediaPipe finds 21 landmarks per hand in each frame, giving 84 numbers per frame (x and y for two hands, zeros when a hand is missing). Each sequence is centred on the wrist and scaled so the model sees hand shape rather than where the hand sits in the frame, then resampled or padded to 64 frames.",
        "A Conformer encoder (6 layers, 384 dimensions, 6 heads, macaron feed-forward blocks and a depthwise convolution module) feeds a 6-layer Transformer decoder over a character vocabulary. Beam search turns it into text. 27.8M parameters.",
        "Trained on the Kaggle Google ASL Fingerspelling data, using the main and supplemental sets.",
      ],
    },
    {
      title: "Evaluation I can defend",
      intro:
        "The number in my original notebook was computed with teacher forcing and on a different evaluation, so I did not trust it. The repo now scores every model the same way.",
      items: [
        "The split is 70/15/15 by signer, so validation and test signers never appear in training. Test is scored once, at the end, on a seeded random sample of 3,000 clips from the 14 held-out signers.",
        "Every comparison reports per-signer CER and a paired interval across signers instead of one number, because only 14 signers means a single average can mislead.",
        "Choices (checkpoint, decoding, thresholds) were made on validation only. The 0.43 to 0.44 figures from the original notebooks came from a different evaluation and are not comparable with the table below.",
        "For scale: the winning Kaggle solutions scored about 0.18 to 0.19 in these units. This model does not reach that, and the write-up says so.",
      ],
    },
    {
      title: "Results on held-out signers",
      table: {
        caption: "Character error rate on 3,000 test clips from 14 unseen signers",
        columns: ["Model", "Test CER (mean per clip)", "Test CER (total edits / characters)"],
        rows: [
          ["First deployed checkpoint (lowest validation loss)", "0.334", "0.322"],
          ["Last-epoch checkpoint, length penalty 0.6", "0.321", "0.308"],
          ["Same checkpoint, length penalty 0.0 (chosen on validation, deployed)", "0.307", "0.299"],
          ["Fine-tuned again with the repo's own trainer", "0.399", ""],
        ],
      },
      items: [
        "Both improvements were found by looking harder at the model, not by training more. The last checkpoint beats the one with the best validation loss because that loss is teacher-forced: it rose slightly from epoch 13 while the decoded text kept improving. It is better for 12 of 14 signers (0.013 lower on test).",
        "Beam search with a length penalty of 0.0 (no pressure toward longer output) is another 0.015 better (12 of 14 signers, paired interval -0.023 to -0.007), and 0.027 better than the first deployed model (13 of 14 signers). It fits the failure mode below: the invented text is longer than what was signed.",
      ],
    },
    {
      title: "Where it fails",
      items: [
        "The errors are lumpy, not spread out. 36% of clips are decoded perfectly, while the 12% of clips with CER of 0.9 or more account for 72% of all the error.",
        "Most of those failures are not near misses. In two thirds of them the model outputs a different kind of phrase than the one signed (a phone number comes out as an address) and the output is longer than the target, as if the decoder made up something fluent when it could not see the hands.",
        "Which signer it is matters more than anything else. Per-signer CER runs from 0.03 to 0.78 and correlates at -0.96 with how often MediaPipe found a hand in that signer's frames. Signers with a hand detected in under a third of frames sit at 0.6 to 0.8 CER.",
        "So the remaining error is mostly an input problem, not a modelling one: when the hands are not detected, there is nothing to read.",
      ],
    },
    {
      title: "Knowing when it is wrong",
      intro:
        "Since the model fails by making text up, I made the system say so. A rule was fitted on validation only and applied once to test.",
      table: {
        caption: "Flag a clip when confidence is below 0.75 or hands are found in under 30% of frames",
        columns: ["Measure (test set)", "Result"],
        rows: [
          ["Clips flagged as unreliable", "40%"],
          ["Badly failed clips (CER 0.9 or more) that get flagged", "98.6%"],
          ["CER on the clips it accepts", "0.059 (against 0.307 overall)"],
          ["AUROC separating failures: confidence / hand rate", "0.89 / 0.86"],
        ],
      },
      items: [
        "The API returns a flagged field with a reason (low hand visibility or low confidence) and Prometheus counters for each, and the demo shows a warning. The thresholds are environment variables.",
        "A caveat I state in the repo: in the app, hand rate comes from MediaPipe on the visitor's own video, while the threshold was fitted on the competition's landmarks, so it may need re-tuning.",
      ],
    },
    {
      title: "Six ideas that did not help",
      intro:
        "I implemented five ideas plus a character language model, each switchable in config and unit tested, then ran an ablation on a Kaggle T4 (about 5 hours). Every variant warm-started from the deployed weights and was scored with the same protocol.",
      table: {
        caption: "Test CER with beam search; lower is better",
        columns: ["Run", "What changed", "Val CER", "Test CER"],
        rows: [
          ["Deployed weights, untouched", "no training", "", "0.334"],
          ["a0 baseline", "fine-tune with the repo's trainer", "0.350", "0.399"],
          ["a1 CTC", "add a CTC loss beside the attention loss", "0.383", "0.433"],
          ["a2 length 128", "128 frames instead of 64", "0.407", "0.450"],
          ["a3 velocity", "add frame-to-frame velocity features", "0.365", "0.408"],
          ["a4 strong augmentation", "rotation, aspect jitter, missed-hand spans", "0.355", "0.399"],
          ["a5 all four", "everything together", "0.392", "0.436"],
        ],
      },
      items: [
        "Nothing beat the deployed weights, and fine-tuning made them worse (0.065 higher on average, worse for all 14 signers, paired interval 0.047 to 0.089). I first read a0 as a fair baseline and only caught this once I scored the untouched weights with the same protocol.",
        "I also noted why this is not a fair test of the ideas: each variant started from weights trained for something else and trained for a few epochs, so anything that changes the input or adds a head had to be adapted onto them. That is the question the next section answers.",
        "More training on the same signers overfit: validation was best after the first epoch and drifted worse while training accuracy kept climbing. The character language model did not help either (its best tuned weight was 0).",
      ],
    },
    {
      title: "Training from scratch",
      intro:
        "To answer the fairness question, I trained from random weights with the ingredients the top Kaggle solutions used: 192 frames, heavy augmentation, CutMix on half the clips, decoder input masking, a joint CTC loss and weight averaging. One 16-epoch run on a Kaggle T4 took 2 hours 45 minutes.",
      table: {
        caption: "Same signer split and protocol as above",
        columns: ["Model", "Val CER", "Test CER (mean per clip)"],
        rows: [
          ["Tuned deployed model", "0.270", "0.307"],
          ["From scratch, CTC head", "0.300", "0.332"],
          ["From scratch, attention decoder", "0.373", "0.429"],
        ],
      },
      items: [
        "It did not beat the deployed model (the CTC head is 0.022 behind, paired interval 0.009 to 0.035, better for only 4 of 14 signers), so nothing was changed in the app.",
        "I read it as under-trained rather than as a failed recipe: validation CER was still falling when the schedule ended, and the winning solutions trained for about 300 epochs. The CTC head beat the attention decoder for all 14 signers, which fits the attention decoder needing far more epochs to learn to read the encoder.",
        "The CTC head has no sequence confidence, so the flag rule only applies to the attention decoder.",
      ],
    },
    {
      title: "Serving and monitoring",
      items: [
        "A FastAPI service takes a video (POST /predict) or raw (T, 84) landmarks (POST /predict/landmarks), reports the model version on /health and exposes Prometheus metrics on /metrics, and writes a structured log line per request.",
        "Metrics cover request rate and latency, beam search time, prediction confidence, how many frames had a hand and how many videos had no hands at all.",
        "A drift monitor compares live inputs (clip length, share of frames with each hand, amount of motion) to a reference built from training data using the population stability index over a rolling window. Prometheus alert rules cover drift, a high no-hands rate, slow inference and low confidence, with a provisioned Grafana dashboard.",
        "I ran the whole docker compose stack (api, MLflow, Prometheus, Grafana): 30 test requests showed up in Prometheus, every dashboard panel returned data and the four alert rules loaded. The test clips were noise, so the drift score was far above the alert level, as it should be.",
      ],
    },
    {
      title: "Making inference faster",
      table: {
        caption: "Real weights, 40 noise clips, 4 CPU threads on a laptop (measures speed and agreement, not accuracy)",
        columns: ["Runtime", "Median latency per clip", "Size", "Same text as PyTorch"],
        rows: [
          ["PyTorch", "about 660 ms", "113 MB", ""],
          ["ONNX fp32", "about 410 ms", "114 MB", "100%"],
          ["ONNX int8 (matrix multiplies only)", "about 370 ms", "47 MB", "80%"],
        ],
      },
      items: [
        "fp32 ONNX is 1.6x faster with identical output, so it is the service default. int8 is smaller but changed the text on one clip in five, so I would not ship it without checking CER on real test data. Quantising the convolutions as well made things worse, so I left them out.",
        "Beam search now runs all live beams in one decoder call instead of one call per beam: a clip went from about 1.4 s to 0.64 s with identical output on every clip tried, backed by a test against the original implementation.",
      ],
    },
    {
      title: "MLOps and delivery",
      items: [
        "DVC chains preprocess, train and evaluate so only stale stages rerun. MLflow logs parameters, per-epoch metrics, the git commit and the checkpoint, and a promotion step only moves the production alias if test CER clears a threshold.",
        "CI runs on every push: lint, the test suite on Python 3.10 and 3.12, a short training run on generated data, an evaluation with a metric gate that fails if CER or exact match regress, an ONNX export, then builds the Docker image and calls the running container. A release workflow publishes the image to GHCR when a version tag is pushed (I have not tagged one yet, so that workflow has never run, and the README says so).",
        "The demo runs as a Gradio Space on free ZeroGPU hardware with the model call wrapped for GPU and everything else on CPU. The weights live in a Hugging Face model repo and download at startup, so nothing large is in git. A workflow redeploys the Space when the model or app code changes.",
        "The demo has an optional LLM step (Llama via Groq) that snaps noisy output onto a fixed word list. It is a demo feature and none of the reported numbers use it.",
      ],
    },
    {
      title: "Where I stopped, and what I would do next",
      items: [
        "I stopped at the tuned model (test CER 0.307, with 40% of clips flagged as unreliable) because the next gains need a longer run or better inputs, not more tuning.",
        "Next: a from-scratch run of 60 or more epochs (about 8 hours of T4 time), pose and lip landmarks for clips where the hands are missed (where most of the remaining error is), z coordinates as extra features, putting the FastAPI service somewhere public (the Space only runs the Gradio demo), and tagging a release.",
        "Limitations: isolated fingerspelling clips only, no full sentences. It struggles with bad lighting, odd camera angles and signers unlike the training set, and short words tend to get made up. The model was trained on the competition's landmarks but the demo runs MediaPipe on the visitor's own video, so there is a domain gap.",
      ],
    },
  ],
};
